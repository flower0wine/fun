import { useMemo, useRef } from 'react'
import { AdditiveBlending, BackSide, Color } from 'three'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'

export function EarthCore() {
  const earthRef = useRef(null)
  const cloudsRef = useRef(null)

  const [dayMap, nightMap, specularMap, normalMap, cloudMap] = useTexture([
    '/textures/earth_day.jpg',
    '/textures/earth_night.png',
    '/textures/earth_specular.jpg',
    '/textures/earth_normal.jpg',
    '/textures/earth_clouds.png',
  ])

  const atmosphereColor = useMemo(() => new Color('#35cbff'), [])

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.06
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.075
    }
  })

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 128, 128]} />
        <meshPhongMaterial
          map={dayMap}
          emissiveMap={nightMap}
          emissive="#173a6b"
          emissiveIntensity={0.75}
          specularMap={specularMap}
          normalMap={normalMap}
          shininess={18}
        />
      </mesh>

      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.03, 96, 96]} />
        <meshPhongMaterial map={cloudMap} transparent opacity={0.32} depthWrite={false} />
      </mesh>

      <mesh scale={1.09}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color={atmosphereColor}
          side={BackSide}
          transparent
          opacity={0.24}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
