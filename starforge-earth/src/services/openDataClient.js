const ISS_ENDPOINT = 'https://api.wheretheiss.at/v1/satellites/25544'
const QUAKE_ENDPOINT = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'
const APOD_ENDPOINT = 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY'

async function fetchJson(url, timeout = 12000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchIssPosition() {
  const data = await fetchJson(ISS_ENDPOINT, 10000)

  return {
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    altitude: Number(data.altitude),
    velocity: Number(data.velocity),
    visibility: data.visibility ?? 'unknown',
    timestamp: Number(data.timestamp) * 1000,
  }
}

export async function fetchQuakeFeed() {
  const data = await fetchJson(QUAKE_ENDPOINT, 15000)

  const quakes = (data.features ?? [])
    .map((feature) => {
      const [longitude, latitude, depth] = feature.geometry?.coordinates ?? []

      return {
        id: feature.id,
        place: feature.properties?.place ?? 'Unknown place',
        magnitude: Number(feature.properties?.mag ?? 0),
        time: Number(feature.properties?.time ?? Date.now()),
        longitude: Number(longitude),
        latitude: Number(latitude),
        depth: Number(depth ?? 0),
      }
    })
    .filter((quake) => Number.isFinite(quake.latitude) && Number.isFinite(quake.longitude))

  return quakes
}

export async function fetchApod() {
  const data = await fetchJson(APOD_ENDPOINT, 15000)

  return {
    date: data.date ?? '',
    title: data.title ?? 'Astronomy Picture of the Day',
    explanation: data.explanation ?? '',
    url: data.url ?? '',
    mediaType: data.media_type ?? 'image',
    copyright: data.copyright ?? 'NASA',
  }
}
