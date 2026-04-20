import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../../../../hooks/usePrefersReducedMotion'

const orbiters = [
  { className: 'orbiter orbiter-a', duration: 10, delay: 0 },
  { className: 'orbiter orbiter-b', duration: 14, delay: -3 },
  { className: 'orbiter orbiter-c', duration: 12, delay: -6 },
]

export function OrbitalStage() {
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <div className="orbital-stage" aria-hidden="true">
      <motion.div
        className="orbital-core"
        animate={
          prefersReducedMotion
            ? undefined
            : { scale: [1, 1.08, 1], rotate: [0, 8, 0] }
        }
        transition={{
          duration: 6,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
      />

      {orbiters.map((orbiter) => (
        <motion.div
          key={orbiter.className}
          className={orbiter.className}
          animate={prefersReducedMotion ? undefined : { rotate: 360 }}
          transition={{
            duration: orbiter.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'linear',
            delay: orbiter.delay,
          }}
        >
          <span />
        </motion.div>
      ))}

      <div className="stage-noise" />
      <div className="stage-grid" />
    </div>
  )
}
