import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { latLonToVector3, createArcPoints } from '../../utils/geo'

function QuakePins({ quakes }) {
  return (
    <group>
      {quakes.map((quake) => {
        const point = latLonToVector3(quake.latitude, quake.longitude, 2.03)
        const scale = 0.004 + Math.max(0.006, quake.magnitude * 0.004)
        const hue = Math.max(0, 190 - quake.magnitude * 45)

        return (
          <mesh key={quake.id} position={point}>
            <sphereGeometry args={[scale, 10, 10]} />
            <meshStandardMaterial
              color={`hsl(${hue}, 92%, 58%)`}
              emissive={`hsl(${hue}, 100%, 52%)`}
              emissiveIntensity={2}
              metalness={0.1}
              roughness={0.2}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function SignalArcs({ quakes, issPosition }) {
  const arcLines = useMemo(() => {
    if (!issPosition) return []

    const iss = latLonToVector3(issPosition.latitude, issPosition.longitude, 2.2)

    return quakes.slice(0, 6).map((quake) => {
      const origin = latLonToVector3(quake.latitude, quake.longitude, 2.05)
      return {
        id: `${quake.id}-arc`,
        points: createArcPoints(origin, iss, 32, 0.3 + quake.magnitude * 0.02),
        magnitude: quake.magnitude,
      }
    })
  }, [issPosition, quakes])

  return (
    <group>
      {arcLines.map((arc) => (
        <Line
          key={arc.id}
          points={arc.points}
          color="hsl(186, 90%, 58%)"
          lineWidth={1 + arc.magnitude * 0.2}
          transparent
          opacity={0.55}
        />
      ))}
    </group>
  )
}

function IssMarker({ iss }) {
  if (!iss) return null

  const point = latLonToVector3(iss.latitude, iss.longitude, 2.2)

  return (
    <group position={point}>
      <mesh>
        <sphereGeometry args={[0.035, 24, 24]} />
        <meshStandardMaterial color="#b7ffff" emissive="#3df7ff" emissiveIntensity={4.5} />
      </mesh>
      <mesh>
        <ringGeometry args={[0.06, 0.085, 32]} />
        <meshBasicMaterial color="#66fdff" transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

export function GeoOverlays({ quakes, iss }) {
  return (
    <group>
      <QuakePins quakes={quakes} />
      <SignalArcs quakes={quakes} issPosition={iss} />
      <IssMarker iss={iss} />
    </group>
  )
}
