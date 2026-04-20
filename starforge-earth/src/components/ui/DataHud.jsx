import { motion } from 'framer-motion'
import { formatCoordinate } from '../../utils/geo'

function StatusTag({ label, status }) {
  const normalized = status || 'idle'

  return (
    <span className={`status status-${normalized}`}>
      {label}: {normalized.toUpperCase()}
    </span>
  )
}

export function DataHud({ iss, quakeStats, quakes, apod, status, lastUpdated }) {
  const hottestQuake = quakes[0]

  return (
    <motion.section
      className="panel panel-data"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.14 }}
    >
      <header className="panel-header">
        <h2>Orbital Signal Deck</h2>
        <div className="status-wrap">
          <StatusTag label="ISS" status={status.iss} />
          <StatusTag label="QUAKES" status={status.quakes} />
          <StatusTag label="APOD" status={status.apod} />
        </div>
      </header>

      <div className="metric-grid">
        <motion.article className="metric-card" whileHover={{ y: -4, scale: 1.01 }} transition={{ type: 'spring', stiffness: 300, damping: 17 }}>
          <h3>ISS Position</h3>
          <p>{iss ? formatCoordinate(iss.latitude, iss.longitude) : 'syncing...'}</p>
          <small>{iss ? `${iss.altitude.toFixed(1)} km altitude` : '--'}</small>
        </motion.article>

        <motion.article className="metric-card" whileHover={{ y: -4, scale: 1.01 }} transition={{ type: 'spring', stiffness: 300, damping: 17 }}>
          <h3>Daily Quakes</h3>
          <p>{quakeStats.count}</p>
          <small>Max M {quakeStats.maxMagnitude.toFixed(1)}</small>
        </motion.article>

        <motion.article className="metric-card" whileHover={{ y: -4, scale: 1.01 }} transition={{ type: 'spring', stiffness: 300, damping: 17 }}>
          <h3>Average Magnitude</h3>
          <p>{quakeStats.meanMagnitude.toFixed(2)}</p>
          <small>USGS past 24h feed</small>
        </motion.article>

        <motion.article className="metric-card" whileHover={{ y: -4, scale: 1.01 }} transition={{ type: 'spring', stiffness: 300, damping: 17 }}>
          <h3>Strongest Pulse</h3>
          <p>{hottestQuake ? `M ${hottestQuake.magnitude.toFixed(1)}` : '--'}</p>
          <small>{hottestQuake ? hottestQuake.place : 'no data'}</small>
        </motion.article>
      </div>

      {apod?.mediaType === 'image' && apod?.url ? (
        <motion.figure
          className="apod"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 140, damping: 20 }}
        >
          <img src={apod.url} alt={apod.title} loading="lazy" />
          <figcaption>
            <strong>{apod.title}</strong>
            <span>{apod.date}</span>
          </figcaption>
        </motion.figure>
      ) : null}

      <p className="updated-at">
        Last sync: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'initializing'}
      </p>
    </motion.section>
  )
}
