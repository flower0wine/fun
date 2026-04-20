import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchApod, fetchIssPosition, fetchQuakeFeed } from '../services/openDataClient'

function getQuakeStats(quakes) {
  if (!quakes.length) {
    return { count: 0, maxMagnitude: 0, meanMagnitude: 0 }
  }

  const magnitudeTotal = quakes.reduce((total, q) => total + (q.magnitude || 0), 0)
  const maxMagnitude = Math.max(...quakes.map((q) => q.magnitude || 0))

  return {
    count: quakes.length,
    maxMagnitude,
    meanMagnitude: magnitudeTotal / quakes.length,
  }
}

export function useOpenSpaceData() {
  const [iss, setIss] = useState(null)
  const [quakes, setQuakes] = useState([])
  const [apod, setApod] = useState(null)
  const [status, setStatus] = useState({ iss: 'idle', quakes: 'idle', apod: 'idle' })
  const [lastUpdated, setLastUpdated] = useState(null)

  const refreshRealtime = useCallback(async () => {
    setStatus((prev) => ({ ...prev, iss: 'loading', quakes: 'loading' }))

    const [issResult, quakeResult] = await Promise.allSettled([
      fetchIssPosition(),
      fetchQuakeFeed(),
    ])

    if (issResult.status === 'fulfilled') {
      setIss(issResult.value)
      setStatus((prev) => ({ ...prev, iss: 'ok' }))
    } else {
      setStatus((prev) => ({ ...prev, iss: 'error' }))
    }

    if (quakeResult.status === 'fulfilled') {
      setQuakes(quakeResult.value)
      setStatus((prev) => ({ ...prev, quakes: 'ok' }))
    } else {
      setStatus((prev) => ({ ...prev, quakes: 'error' }))
    }

    setLastUpdated(new Date())
  }, [])

  const refreshDaily = useCallback(async () => {
    setStatus((prev) => ({ ...prev, apod: 'loading' }))

    try {
      const data = await fetchApod()
      setApod(data)
      setStatus((prev) => ({ ...prev, apod: 'ok' }))
    } catch {
      setStatus((prev) => ({ ...prev, apod: 'error' }))
    }
  }, [])

  useEffect(() => {
    refreshRealtime()
    refreshDaily()

    const realtimeInterval = window.setInterval(refreshRealtime, 15000)
    const dailyInterval = window.setInterval(refreshDaily, 2 * 60 * 60 * 1000)

    return () => {
      window.clearInterval(realtimeInterval)
      window.clearInterval(dailyInterval)
    }
  }, [refreshRealtime, refreshDaily])

  const quakeStats = useMemo(() => getQuakeStats(quakes), [quakes])

  return {
    iss,
    quakes,
    quakeStats,
    apod,
    status,
    lastUpdated,
    refreshRealtime,
    refreshDaily,
  }
}
