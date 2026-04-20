import { Stars } from '@react-three/drei'

export function SceneEffects() {
  return (
    <>
      <fog attach="fog" args={['#020610', 7.5, 22]} />
      <Stars radius={100} depth={40} count={2600} factor={3} saturation={0} fade speed={0.2} />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -3.45, 0]}>
        <ringGeometry args={[2.6, 4.8, 128]} />
        <meshBasicMaterial color="#2ab8ff" transparent opacity={0.12} />
      </mesh>
    </>
  )
}
