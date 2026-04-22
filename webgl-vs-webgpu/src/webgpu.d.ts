declare interface Navigator {
  gpu: GPU
}

declare interface GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>
  getPreferredCanvasFormat(): GPUTextureFormat
}

declare interface GPURequestAdapterOptions {
  powerPreference?: 'low-power' | 'high-performance'
}

declare interface GPUAdapter {
  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>
}

declare interface GPUDeviceDescriptor {
  requiredFeatures?: string[]
}

declare interface GPUDevice {
  queue: GPUQueue
  createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer
  createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule
  createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline
  createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup
  createCommandEncoder(): GPUCommandEncoder
}

declare interface GPUQueue {
  writeBuffer(buffer: GPUBuffer, bufferOffset: number, data: BufferSource): void
  submit(commandBuffers: GPUCommandBuffer[]): void
}

declare interface GPUBufferDescriptor {
  size: number
  usage: number
}

declare interface GPUShaderModuleDescriptor {
  code: string
}

declare interface GPURenderPipelineDescriptor {
  layout: 'auto' | unknown
  vertex: {
    module: GPUShaderModule
    entryPoint: string
  }
  fragment?: {
    module: GPUShaderModule
    entryPoint: string
    targets: GPUColorTargetState[]
  }
  primitive?: {
    topology?: 'triangle-list' | 'triangle-strip' | 'point-list' | 'line-list'
  }
}

declare interface GPUColorTargetState {
  format: GPUTextureFormat
  blend?: GPUBlendState
}

declare interface GPUBlendState {
  color: GPUBlendComponent
  alpha: GPUBlendComponent
}

declare interface GPUBlendComponent {
  srcFactor: GPUBlendFactor
  dstFactor: GPUBlendFactor
  operation: GPUBlendOperation
}

declare type GPUBlendFactor =
  | 'zero'
  | 'one'
  | 'src'
  | 'one-minus-src'
  | 'src-alpha'
  | 'one-minus-src-alpha'

declare type GPUBlendOperation = 'add' | 'subtract'

declare interface GPUBindGroupDescriptor {
  layout: GPUBindGroupLayout
  entries: GPUBindGroupEntry[]
}

declare interface GPUBindGroupEntry {
  binding: number
  resource: GPUBindingResource
}

declare type GPUBindingResource = { buffer: GPUBuffer }

declare interface GPURenderPipeline {
  getBindGroupLayout(index: number): GPUBindGroupLayout
}

declare interface GPUBindGroupLayout {}
declare interface GPUBindGroup {}
declare interface GPUBuffer {}
declare interface GPUShaderModule {}
declare interface GPUCommandBuffer {}

declare interface GPUCommandEncoder {
  beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder
  finish(): GPUCommandBuffer
}

declare interface GPURenderPassDescriptor {
  colorAttachments: GPURenderPassColorAttachment[]
}

declare interface GPURenderPassColorAttachment {
  view: GPUTextureView
  clearValue: GPUColor
  loadOp: GPULoadOp
  storeOp: GPUStoreOp
}

declare interface GPURenderPassEncoder {
  setPipeline(pipeline: GPURenderPipeline): void
  setBindGroup(index: number, bindGroup: GPUBindGroup): void
  draw(vertexCount: number, instanceCount?: number): void
  end(): void
}

declare interface GPUCanvasContext {
  configure(configuration: GPUCanvasConfiguration): void
  getCurrentTexture(): GPUTexture
}

declare interface GPUCanvasConfiguration {
  device: GPUDevice
  format: GPUTextureFormat
  alphaMode?: 'opaque' | 'premultiplied'
}

declare interface GPUTexture {
  createView(): GPUTextureView
}

declare interface GPUTextureView {}

declare type GPUTextureFormat = string
declare type GPULoadOp = 'load' | 'clear'
declare type GPUStoreOp = 'store' | 'discard'

declare interface GPUColor {
  r: number
  g: number
  b: number
  a: number
}

declare const GPUBufferUsage: {
  readonly COPY_DST: number
  readonly STORAGE: number
  readonly UNIFORM: number
}
