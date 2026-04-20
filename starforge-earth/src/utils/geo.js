import * as THREE from 'three'

const DEG_TO_RAD = Math.PI / 180

export function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * DEG_TO_RAD
  const theta = (lon + 180) * DEG_TO_RAD

  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

export function createArcPoints(start, end, segments = 40, elevation = 0.35) {
  const points = []
  const mid = start.clone().lerp(end, 0.5).normalize().multiplyScalar(start.length() + elevation)

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments
    const p1 = start.clone().lerp(mid, t)
    const p2 = mid.clone().lerp(end, t)
    points.push(p1.lerp(p2, t))
  }

  return points
}

export function formatCoordinate(lat, lon) {
  const latSuffix = lat >= 0 ? 'N' : 'S'
  const lonSuffix = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(2)}°${latSuffix}, ${Math.abs(lon).toFixed(2)}°${lonSuffix}`
}
