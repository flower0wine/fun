import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EarthCore } from './EarthCore'
import { GeoOverlays } from './GeoOverlays'
import { SceneEffects } from './SceneEffects'

export function NeoEarthScene({ iss, quakes, focusMode }) {
  const minDistance = focusMode === 'orbit' ? 4.7 : 6
  const maxDistance = focusMode === 'orbit' ? 8 : 10.5

  return (
    <Canvas camera={{ position: [0.9, 1.8, 7.5], fov: 42 }} dpr={[1, 2]}>
      <color attach="background" args={['#02040c']} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 3, 4]} intensity={2.2} color="#9adfff" />
      <pointLight position={[-4, -1.5, -3]} intensity={1.2} color="#3bd6ff" />
      <SceneEffects />
      <EarthCore />
      <GeoOverlays quakes={quakes} iss={iss} />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.7}
        minDistance={minDistance}
        maxDistance={maxDistance}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </Canvas>
  )
}
