import { motion } from 'framer-motion'
import type { SceneDefinition } from '../data/scenes'

type SceneCardProps = {
  scene: SceneDefinition
}

export function SceneCard({ scene }: SceneCardProps) {
  return (
    <motion.article
      className="scene-card"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="scene-card-topline">
        <span className={`scene-status is-${scene.status}`}>
          {scene.status === 'ready' ? 'Ready' : 'Draft'}
        </span>
        <span className="scene-id">{scene.id}</span>
      </div>

      <h3>{scene.title}</h3>
      <p>{scene.summary}</p>

      <div className="scene-stack">
        {scene.stack.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </motion.article>
  )
}
