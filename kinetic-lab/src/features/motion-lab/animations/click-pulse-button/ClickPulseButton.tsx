import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from 'framer-motion'
import { useState } from 'react'
import { usePrefersReducedMotion } from '../../../../hooks/usePrefersReducedMotion'

type Ripple = {
  id: number
}

export function ClickPulseButton() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [clickCount, setClickCount] = useState(0)
  const press = useMotionValue(0)
  const scale = useTransform(press, [0, 1], [1, 0.92])
  const rotate = useTransform(press, [0, 1], [0, -2])
  const glow = useTransform(press, [0, 1], [0.45, 0.9])
  const boxShadow = useMotionTemplate`0 18px 55px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255,255,255,0.10), 0 0 42px rgba(109, 211, 255, ${glow})`

  const handlePressStart = () => {
    if (prefersReducedMotion) {
      return
    }

    void animate(press, 1, {
      type: 'spring',
      stiffness: 520,
      damping: 28,
      mass: 0.45,
    })
  }

  const handlePressEnd = () => {
    if (prefersReducedMotion) {
      return
    }

    void animate(press, 0, {
      type: 'spring',
      stiffness: 320,
      damping: 16,
      mass: 0.6,
    })
  }

  const handleClick = () => {
    const rippleId = Date.now()
    setClickCount((count) => count + 1)
    setRipples((items) => [...items, { id: rippleId }])
  }

  const removeRipple = (id: number) => {
    setRipples((items) => items.filter((item) => item.id !== id))
  }

  return (
    <section className="section-block">
      <div className="section-heading">
        <div>
          <span className="section-kicker">Animation Demo</span>
          <h2>点击时会灵动响应的按钮</h2>
        </div>
        <p className="demo-meta">Clicks: {clickCount}</p>
      </div>

      <div className="button-demo">
        <motion.button
          type="button"
          className="pulse-button"
          style={
            prefersReducedMotion
              ? undefined
              : {
                  scale,
                  rotate,
                  boxShadow,
                }
          }
          whileHover={
            prefersReducedMotion
              ? undefined
              : {
                  y: -3,
                }
          }
          onPointerDown={handlePressStart}
          onPointerUp={handlePressEnd}
          onPointerLeave={handlePressEnd}
          onClick={handleClick}
        >
          <motion.span
            className="pulse-button-sheen"
            animate={
              prefersReducedMotion
                ? undefined
                : { x: ['-120%', '130%'] }
            }
            transition={{
              duration: 2.8,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
              repeatDelay: 1.1,
            }}
          />

          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              className="pulse-ripple"
              initial={{ opacity: 0.34, scale: 0.2 }}
              animate={{ opacity: 0, scale: 1.85 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              onAnimationComplete={() => removeRipple(ripple.id)}
            />
          ))}

          <span className="pulse-button-label">
            Tap the pulse
            <strong>让点击有弹性、有呼吸感</strong>
          </span>
        </motion.button>
      </div>
    </section>
  )
}
