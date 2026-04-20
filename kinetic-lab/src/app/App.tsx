import { motion } from 'framer-motion'
import { SceneCard } from '../features/motion-lab/components/SceneCard'
import { ClickPulseButton } from '../features/motion-lab/animations/click-pulse-button/ClickPulseButton'
import { OrbitalStage } from '../features/motion-lab/animations/orbital-ribbons/OrbitalStage'
import { scenes } from '../features/motion-lab/data/scenes'

function App() {
  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">TS + React Motion Lab</span>
          <h1>为非常规动画实验预留好骨架。</h1>
          <p className="hero-text">
            当前项目已经拆成应用壳、动画特性层、通用 hooks 与样式系统。后续要加新的动画场景，只需要新增一个模块并在场景清单里注册。
          </p>

          <div className="hero-tags" aria-label="stack">
            <span>React 19</span>
            <span>TypeScript</span>
            <span>Vite</span>
            <span>Framer Motion</span>
          </div>
        </div>

        <motion.div
          className="hero-stage-frame"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <OrbitalStage />
        </motion.div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <span className="section-kicker">Scene Registry</span>
          <h2>动画场景入口已经就位</h2>
        </div>

        <div className="scene-grid">
          {scenes.map((scene) => (
            <SceneCard key={scene.id} scene={scene} />
          ))}
        </div>
      </section>

      <ClickPulseButton />
    </main>
  )
}

export default App
