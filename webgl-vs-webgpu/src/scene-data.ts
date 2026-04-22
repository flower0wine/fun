export type ParticleSeed = {
  radius: number
  speed: number
  angle: number
  size: number
  hue: number
}

function fract(value: number) {
  return value - Math.floor(value)
}

export function createParticleSeeds(count: number): Float32Array {
  const data = new Float32Array(count * 5)

  for (let index = 0; index < count; index += 1) {
    const seed = index + 1
    const base = index * 5
    const radius = 0.18 + fract(Math.sin(seed * 12.9898) * 43758.5453) * 0.62
    const speed = 0.45 + fract(Math.sin(seed * 78.233) * 14285.731) * 1.35
    const angle = fract(Math.sin(seed * 0.345) * 837.13) * Math.PI * 2
    const size = 7 + fract(Math.sin(seed * 4.123) * 1947.1) * 16
    const hue = fract(Math.sin(seed * 5.371) * 3568.21)

    data[base] = radius
    data[base + 1] = speed
    data[base + 2] = angle
    data[base + 3] = size
    data[base + 4] = hue
  }

  return data
}
