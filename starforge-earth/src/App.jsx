import { Suspense, lazy, useState } from 'react'
import { motion } from 'framer-motion'
import { ControlDeck } from './components/ui/ControlDeck'
import { DataHud } from './components/ui/DataHud'
import { useOpenSpaceData } from './hooks/useOpenSpaceData'
import { OPEN_DATA_SOURCES } from './data/sources'
import './styles/app.css'

const NeoEarthScene = lazy(() =>
  import('./components/scene/NeoEarthScene').then((module) => ({
    default: module.NeoEarthScene,
  })),
)

function App() {
  const [focusMode, setFocusMode] = useState('orbit')
  const { iss, quakes, quakeStats, apod, status, lastUpdated, refreshRealtime, refreshDaily } =
    useOpenSpaceData()

  const topQuakes = [...quakes]
    .sort((a, b) => (b.magnitude || 0) - (a.magnitude || 0))
    .slice(0, 40)

  const handleRefresh = () => {
    refreshRealtime()
    refreshDaily()
  }

  return (
    <main className="app-shell">
      <motion.div
        className="nebula"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />

      <section className="scene-shell">
        <Suspense fallback={<div className="scene-loading">Loading orbital renderer...</div>}>
          <NeoEarthScene iss={iss} quakes={topQuakes} focusMode={focusMode} />
        </Suspense>
      </section>

      <aside className="hud-shell">
        <ControlDeck focusMode={focusMode} onFocusChange={setFocusMode} onRefresh={handleRefresh} />
        <DataHud
          iss={iss}
          quakeStats={quakeStats}
          quakes={topQuakes}
          apod={apod}
          status={status}
          lastUpdated={lastUpdated}
        />
      </aside>

      <footer className="data-sources">
        <h4>Open Data Sources</h4>
        <ul>
          {OPEN_DATA_SOURCES.map((source) => (
            <li key={source.name}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.name}
              </a>
              <span>{source.usage}</span>
            </li>
          ))}
        </ul>
      </footer>
    </main>
  )
}

export default App
