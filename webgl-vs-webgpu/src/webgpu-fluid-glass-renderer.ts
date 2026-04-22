const shaderSource = `
struct Uniforms {
  resolution: vec2<f32>,
  pointer: vec2<f32>,
  time: f32,
  pointerMix: f32,
  padding: vec2<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

fn bgWaves(uv: vec2<f32>, time: f32) -> vec3<f32> {
  let warm = vec3<f32>(1.0, 0.62, 0.40);
  let cool = vec3<f32>(0.28, 0.67, 0.98);
  let mint = vec3<f32>(0.45, 0.93, 0.82);
  let pink = vec3<f32>(1.0, 0.52, 0.78);

  let stripeA = 0.5 + 0.5 * sin(uv.x * 10.0 + time * 0.8);
  let stripeB = 0.5 + 0.5 * sin(uv.y * 8.0 - time * 0.65 + uv.x * 2.4);
  let bloomA = smoothstep(0.42, 0.0, distance(uv, vec2<f32>(0.18 + 0.05 * sin(time * 0.2), 0.22)));
  let bloomB = smoothstep(0.54, 0.0, distance(uv, vec2<f32>(0.84, 0.32 + 0.08 * cos(time * 0.16))));
  let bloomC = smoothstep(0.58, 0.0, distance(uv, vec2<f32>(0.52 + 0.08 * sin(time * 0.1), 0.78)));

  var color = mix(vec3<f32>(0.94, 0.92, 0.98), cool, stripeA * 0.42);
  color = mix(color, warm, stripeB * 0.32);
  color += bloomA * pink * 0.9;
  color += bloomB * mint * 0.68;
  color += bloomC * cool * 0.58;

  let grid = smoothstep(0.97, 1.0, sin((uv.x + uv.y + time * 0.02) * 80.0));
  color += grid * 0.04;
  return color;
}

fn sdRoundedBox(p: vec2<f32>, b: vec2<f32>, r: f32) -> f32 {
  let q = abs(p) - b + vec2<f32>(r, r);
  return length(max(q, vec2<f32>(0.0))) + min(max(q.x, q.y), 0.0) - r;
}

fn blobCenter(index: u32, time: f32, pointer: vec2<f32>, pointerMix: f32) -> vec2<f32> {
  if (index == 0u) {
    return mix(
      vec2<f32>(0.5 + 0.07 * sin(time * 0.55), 0.53 + 0.06 * cos(time * 0.48)),
      pointer,
      0.38 * pointerMix
    );
  }
  if (index == 1u) {
    return vec2<f32>(0.34 + 0.08 * cos(time * 0.44), 0.42 + 0.1 * sin(time * 0.51));
  }
  if (index == 2u) {
    return vec2<f32>(0.68 + 0.09 * sin(time * 0.37), 0.46 + 0.09 * cos(time * 0.34));
  }
  if (index == 3u) {
    return vec2<f32>(0.43 + 0.12 * sin(time * 0.28), 0.68 + 0.06 * cos(time * 0.42));
  }
  return vec2<f32>(0.58 + 0.1 * cos(time * 0.31), 0.28 + 0.07 * sin(time * 0.47));
}

fn blobRadius(index: u32) -> f32 {
  if (index == 0u) { return 0.24; }
  if (index == 1u) { return 0.16; }
  if (index == 2u) { return 0.18; }
  if (index == 3u) { return 0.14; }
  return 0.12;
}

fn fluidField(uv: vec2<f32>) -> f32 {
  let pointer = uniforms.pointer;
  var sum = 0.0;
  for (var i: u32 = 0u; i < 5u; i = i + 1u) {
    let center = blobCenter(i, uniforms.time, pointer, uniforms.pointerMix);
    let delta = uv - center;
    let dist2 = max(dot(delta, delta), 0.0009);
    let radius = blobRadius(i);
    sum += (radius * radius) / dist2;
  }
  return sum;
}

fn fieldNormal(uv: vec2<f32>) -> vec2<f32> {
  let eps = 0.004;
  let dx = fluidField(uv + vec2<f32>(eps, 0.0)) - fluidField(uv - vec2<f32>(eps, 0.0));
  let dy = fluidField(uv + vec2<f32>(0.0, eps)) - fluidField(uv - vec2<f32>(0.0, eps));
  return normalize(vec2<f32>(dx, dy) + vec2<f32>(0.0001, 0.0001));
}

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOut {
  var positions = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>( 1.0,  1.0),
  );

  let position = positions[vertexIndex];
  var out: VertexOut;
  out.position = vec4<f32>(position, 0.0, 1.0);
  out.uv = position * 0.5 + 0.5;
  return out;
}

@fragment
fn fs_main(input: VertexOut) -> @location(0) vec4<f32> {
  let uv = input.uv;
  let bg = bgWaves(uv, uniforms.time);
  let field = fluidField(uv);
  let liquidBody = smoothstep(1.6, 2.45, field);
  let liquidEdge = smoothstep(1.55, 1.9, field) - smoothstep(1.9, 2.35, field);
  let innerGlow = smoothstep(2.0, 3.3, field);
  let lensCenter = vec2<f32>(0.57 + 0.03 * sin(uniforms.time * 0.24), 0.55);
  let lensDistance = sdRoundedBox(uv - lensCenter, vec2<f32>(0.26, 0.19), 0.18);
  let lensMask = 1.0 - smoothstep(0.0, 0.03, lensDistance);
  let rimMask = smoothstep(-0.01, 0.03, lensDistance) - smoothstep(0.03, 0.065, lensDistance);
  let body = max(lensMask, liquidBody * 0.92);

  if (body < 0.001) {
    return vec4<f32>(bg, 1.0);
  }

  let normal = fieldNormal(uv);
  let lensDirection = normalize(uv - lensCenter + vec2<f32>(0.0001, 0.0001));
  let combinedNormal = normalize(normal * 0.7 + lensDirection * 0.3);
  let distortion = combinedNormal * (0.016 + liquidBody * 0.014 + lensMask * 0.018);
  let shiftedUv = clamp(uv + distortion, vec2<f32>(0.0), vec2<f32>(1.0));
  let refracted = bgWaves(shiftedUv, uniforms.time);
  let softenedUv = clamp(uv + distortion * 0.4, vec2<f32>(0.0), vec2<f32>(1.0));
  let softened = bgWaves(softenedUv, uniforms.time);

  let pointerDelta = uv - uniforms.pointer;
  let pointerGlow = smoothstep(0.32, 0.0, length(pointerDelta));
  let fresnel = pow(1.0 - abs(dot(combinedNormal, normalize(vec2<f32>(0.35, -0.92)))), 2.2);
  let sparkle = smoothstep(0.986, 1.0, sin((uv.x * 30.0 - uv.y * 26.0 + uniforms.time * 0.75)));
  let shadow = smoothstep(0.06, -0.06, lensDistance) * 0.08;

  var glass = mix(softened, refracted, 0.55);
  glass = mix(glass, vec3<f32>(0.96, 0.98, 1.0), lensMask * 0.08 + innerGlow * 0.04);
  glass += vec3<f32>(0.95, 0.98, 1.0) * (liquidEdge * 0.18 + rimMask * 0.24);
  glass += vec3<f32>(1.0, 1.0, 1.0) * fresnel * 0.16;
  glass += vec3<f32>(0.84, 0.97, 1.0) * sparkle * (liquidEdge * 0.08 + rimMask * 0.08);
  glass += vec3<f32>(0.32, 0.54, 0.95) * pointerGlow * 0.05 * uniforms.pointerMix;
  glass -= vec3<f32>(0.02, 0.025, 0.03) * shadow;

  let alpha = clamp(lensMask * 0.72 + liquidBody * 0.4, 0.0, 0.82);
  let mixed = mix(bg, glass, alpha);
  return vec4<f32>(mixed, 1.0);
}
`

export class WebGpuFluidGlassRenderer {
  private readonly canvas: HTMLCanvasElement
  private readonly setStatus: (status: string) => void
  private animationFrame = 0
  private readonly startTime = performance.now()
  private pointerX = 0.5
  private pointerY = 0.52
  private pointerMix = 0
  private readonly onPointerMove: (event: PointerEvent) => void
  private readonly onPointerLeave: () => void

  constructor(canvas: HTMLCanvasElement, setStatus: (status: string) => void) {
    this.canvas = canvas
    this.setStatus = setStatus
    this.onPointerMove = (event) => {
      const bounds = this.canvas.getBoundingClientRect()
      const x = (event.clientX - bounds.left) / Math.max(bounds.width, 1)
      const y = (event.clientY - bounds.top) / Math.max(bounds.height, 1)
      this.pointerX = Math.min(Math.max(x, 0), 1)
      this.pointerY = Math.min(Math.max(y, 0), 1)
      this.pointerMix = 1
    }
    this.onPointerLeave = () => {
      this.pointerMix = 0
    }
  }

  async start() {
    if (!('gpu' in navigator)) {
      this.setStatus('WebGPU unsupported')
      return
    }

    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      this.setStatus('No adapter')
      return
    }

    const device = await adapter.requestDevice()
    const context = this.canvas.getContext('webgpu') as GPUCanvasContext | null

    if (!context) {
      this.setStatus('Context unavailable')
      return
    }

    const format = navigator.gpu.getPreferredCanvasFormat()
    const configure = () => {
      context.configure({
        device,
        format,
        alphaMode: 'premultiplied',
      })
    }

    configure()

    const uniformBuffer = device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    const shaderModule = device.createShaderModule({ code: shaderSource })
    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [{ format }],
      },
      primitive: {
        topology: 'triangle-list',
      },
    })

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: uniformBuffer },
        },
      ],
    })

    this.canvas.addEventListener('pointermove', this.onPointerMove)
    this.canvas.addEventListener('pointerleave', this.onPointerLeave)
    this.setStatus('Interactive')

    const render = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.floor(this.canvas.clientWidth * ratio)
      const height = Math.floor(this.canvas.clientHeight * ratio)

      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width
        this.canvas.height = height
        configure()
      }

      const time = (performance.now() - this.startTime) * 0.001
      this.pointerMix += (0 - this.pointerMix) * 0.04

      const uniforms = new Float32Array([
        width,
        height,
        this.pointerX,
        this.pointerY,
        time,
        this.pointerMix,
        0,
        0,
      ])
      device.queue.writeBuffer(uniformBuffer, 0, uniforms)

      const encoder = device.createCommandEncoder()
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 0.95, g: 0.93, b: 0.97, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      })

      pass.setPipeline(pipeline)
      pass.setBindGroup(0, bindGroup)
      pass.draw(6)
      pass.end()

      device.queue.submit([encoder.finish()])
      this.animationFrame = window.requestAnimationFrame(render)
    }

    render()
  }

  destroy() {
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave)
    window.cancelAnimationFrame(this.animationFrame)
  }
}
