type Phase = 'idle' | 'leaving' | 'covered' | 'entering'

type Shape = {
  top: number
  edge: number
  curve: number
}

function mix(start: number, end: number, amount: number) {
  return start + (end - start) * amount
}

function shapeToPath(shape: Shape) {
  return `M 0 ${shape.top} V ${shape.edge} Q 50 ${shape.curve} 100 ${shape.edge} V ${shape.top} Z`
}

export function buildMorphPath(phase: Phase, progress: number) {
  if (phase === 'idle') {
    return shapeToPath({ top: 100, edge: 100, curve: 100 })
  }

  if (phase === 'covered') {
    return shapeToPath({ top: 0, edge: 100, curve: 100 })
  }

  if (phase === 'leaving') {
    if (progress < 0.55) {
      const local = progress / 0.55

      return shapeToPath({
        top: 100,
        edge: mix(100, 50, local),
        curve: mix(100, 0, local),
      })
    }

    const local = (progress - 0.55) / 0.45

    return shapeToPath({
      top: 100,
      edge: mix(50, 0, local),
      curve: 0,
    })
  }

  if (progress < 0.48) {
    const local = progress / 0.48

    return shapeToPath({
      top: 0,
      edge: mix(100, 50, local),
      curve: mix(100, 0, local),
    })
  }

  const local = (progress - 0.48) / 0.52

  return shapeToPath({
    top: 0,
    edge: mix(50, 0, local),
    curve: 0,
  })
}
