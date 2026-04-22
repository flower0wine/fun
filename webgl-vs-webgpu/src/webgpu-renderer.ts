import { createParticleSeeds } from './scene-data'

const PARTICLE_COUNT = 180

const shaderSource = `
struct Uniforms {
  time: f32,
  aspect: f32,
  sizeScale: f32,
  padding: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> seeds: array<vec4<f32>>;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) local: vec2<f32>,
  @location(1) hue: f32,
}

fn palette(t: f32) -> vec3<f32> {
  let a = vec3<f32>(0.10, 0.45, 0.93);
  let b = vec3<f32>(0.96, 0.54, 0.18);
  let c = vec3<f32>(0.13, 0.76, 0.59);
  return mix(mix(a, b, smoothstep(0.0, 0.5, t)), c, smoothstep(0.5, 1.0, t));
}

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOut {
  var quad = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>( 1.0,  1.0),
  );

  let seedA = seeds[instanceIndex * 2u];
  let seedB = seeds[instanceIndex * 2u + 1u];
  let radius = seedA.x;
  let speed = seedA.y;
  let angleBase = seedA.z;
  let size = seedA.w;
  let hue = seedB.x;

  let angle = angleBase + uniforms.time * speed;
  let orbit = vec2<f32>(cos(angle), sin(angle)) * radius;
  let drift = vec2<f32>(
    sin(uniforms.time * 0.65 + angleBase * 1.9),
    cos(uniforms.time * 0.52 + angleBase * 2.2)
  ) * 0.09;
  let center = orbit + drift;
  let local = quad[vertexIndex];
  let scale = size * uniforms.sizeScale;
  let offset = vec2<f32>(
    local.x * scale / max(uniforms.aspect, 1.0),
    local.y * scale * min(uniforms.aspect, 1.0)
  );

  var out: VertexOut;
  out.position = vec4<f32>(center + offset, 0.0, 1.0);
  out.local = local;
  out.hue = hue;
  return out;
}

@fragment
fn fs_main(input: VertexOut) -> @location(0) vec4<f32> {
  let distanceToCenter = dot(input.local, input.local);
  if (distanceToCenter > 1.0) {
    discard;
  }

  let glow = smoothstep(1.0, 0.0, distanceToCenter);
  let color = palette(input.hue) * (0.3 + glow * 1.2);
  return vec4<f32>(color, glow);
}
`

export class WebGpuRenderer {
  private readonly canvas: HTMLCanvasElement
  private readonly setStatus: (status: string) => void
  private readonly seeds = createParticleSeeds(PARTICLE_COUNT)
  private animationFrame = 0
  private readonly startTime = performance.now()

  constructor(canvas: HTMLCanvasElement, setStatus: (status: string) => void) {
    this.canvas = canvas
    this.setStatus = setStatus
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
    context.configure({
      device,
      format,
      alphaMode: 'premultiplied',
    })

    const uniformBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    const packedSeeds = new Float32Array(PARTICLE_COUNT * 8)
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const source = index * 5
      const target = index * 8
      packedSeeds[target] = this.seeds[source]
      packedSeeds[target + 1] = this.seeds[source + 1]
      packedSeeds[target + 2] = this.seeds[source + 2]
      packedSeeds[target + 3] = this.seeds[source + 3]
      packedSeeds[target + 4] = this.seeds[source + 4]
      packedSeeds[target + 5] = 0
      packedSeeds[target + 6] = 0
      packedSeeds[target + 7] = 0
    }

    const particleBuffer = device.createBuffer({
      size: packedSeeds.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })
    device.queue.writeBuffer(particleBuffer, 0, packedSeeds)

    const shaderModule = device.createShaderModule({
      code: shaderSource,
    })

    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format,
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
          },
        ],
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
        {
          binding: 1,
          resource: { buffer: particleBuffer },
        },
      ],
    })

    this.setStatus('Active')

    const render = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.floor(this.canvas.clientWidth * ratio)
      const height = Math.floor(this.canvas.clientHeight * ratio)

      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width
        this.canvas.height = height
        context.configure({
          device,
          format,
          alphaMode: 'premultiplied',
        })
      }

      const aspect = width / Math.max(height, 1)
      const uniforms = new Float32Array([
        (performance.now() - this.startTime) * 0.001,
        aspect,
        0.0034,
        0,
      ])
      device.queue.writeBuffer(uniformBuffer, 0, uniforms)

      const encoder = device.createCommandEncoder()
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 0.06, g: 0.07, b: 0.08, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      })

      pass.setPipeline(pipeline)
      pass.setBindGroup(0, bindGroup)
      pass.draw(6, PARTICLE_COUNT)
      pass.end()

      device.queue.submit([encoder.finish()])
      this.animationFrame = window.requestAnimationFrame(render)
    }

    render()
  }

  destroy() {
    window.cancelAnimationFrame(this.animationFrame)
  }
}
