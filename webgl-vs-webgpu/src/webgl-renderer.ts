import { createParticleSeeds } from './scene-data'

const PARTICLE_COUNT = 180

const vertexShaderSource = `
attribute vec4 a_motion;
attribute float a_hue;
uniform float u_time;
uniform vec2 u_resolution;
varying float v_hue;

void main() {
  float radius = a_motion.x;
  float speed = a_motion.y;
  float baseAngle = a_motion.z;
  float size = a_motion.w;

  float angle = baseAngle + u_time * speed;
  vec2 orbit = vec2(cos(angle), sin(angle)) * radius;
  vec2 drift = vec2(
    sin(u_time * 0.7 + baseAngle * 2.4),
    cos(u_time * 0.55 + baseAngle * 1.7)
  ) * 0.08;
  vec2 position = orbit + drift;

  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  gl_Position = vec4(position.x / max(aspect, 1.0), position.y * min(aspect, 1.0), 0.0, 1.0);
  gl_PointSize = size;
  v_hue = a_hue;
}
`

const fragmentShaderSource = `
precision mediump float;
varying float v_hue;

vec3 palette(float t) {
  vec3 a = vec3(0.28, 0.47, 0.86);
  vec3 b = vec3(0.95, 0.56, 0.18);
  vec3 c = vec3(0.13, 0.67, 0.59);
  return mix(mix(a, b, smoothstep(0.0, 0.5, t)), c, smoothstep(0.45, 1.0, t));
}

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float distanceToCenter = dot(uv, uv);
  if (distanceToCenter > 1.0) {
    discard;
  }

  float glow = smoothstep(1.0, 0.0, distanceToCenter);
  vec3 color = palette(v_hue) * (0.45 + glow * 0.95);
  gl_FragColor = vec4(color, glow);
}
`

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)

  if (!shader) {
    throw new Error('Failed to create shader')
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error'
    gl.deleteShader(shader)
    throw new Error(info)
  }

  return shader
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const program = gl.createProgram()

  if (!program) {
    throw new Error('Failed to create WebGL program')
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? 'Unknown program link error'
    gl.deleteProgram(program)
    throw new Error(info)
  }

  return program
}

export class WebGlRenderer {
  private readonly gl: WebGLRenderingContext | null
  private readonly canvas: HTMLCanvasElement
  private readonly setStatus: (status: string) => void
  private animationFrame = 0
  private readonly startTime = performance.now()
  private readonly seeds = createParticleSeeds(PARTICLE_COUNT)

  constructor(canvas: HTMLCanvasElement, setStatus: (status: string) => void) {
    this.canvas = canvas
    this.setStatus = setStatus
    this.gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
    })
  }

  async start() {
    if (!this.gl) {
      this.setStatus('WebGL unavailable')
      return
    }

    const gl = this.gl
    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource)
    const buffer = gl.createBuffer()

    if (!buffer) {
      this.setStatus('Buffer creation failed')
      return
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.seeds, gl.STATIC_DRAW)
    gl.useProgram(program)

    const motionLocation = gl.getAttribLocation(program, 'a_motion')
    const hueLocation = gl.getAttribLocation(program, 'a_hue')
    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')

    gl.enableVertexAttribArray(motionLocation)
    gl.vertexAttribPointer(motionLocation, 4, gl.FLOAT, false, 5 * 4, 0)
    gl.enableVertexAttribArray(hueLocation)
    gl.vertexAttribPointer(hueLocation, 1, gl.FLOAT, false, 5 * 4, 4 * 4)

    this.setStatus('Active')

    const render = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.floor(this.canvas.clientWidth * ratio)
      const height = Math.floor(this.canvas.clientHeight * ratio)

      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width
        this.canvas.height = height
      }

      gl.viewport(0, 0, width, height)
      gl.clearColor(0.06, 0.07, 0.08, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)

      const time = (performance.now() - this.startTime) * 0.001
      gl.uniform1f(timeLocation, time)
      gl.uniform2f(resolutionLocation, width, height)
      gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT)

      this.animationFrame = window.requestAnimationFrame(render)
    }

    render()
  }

  destroy() {
    window.cancelAnimationFrame(this.animationFrame)
  }
}
