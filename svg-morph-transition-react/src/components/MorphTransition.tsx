import { buildMorphPath } from '../lib/morphPath'

type Phase = 'idle' | 'leaving' | 'covered' | 'entering'

type MorphTransitionProps = {
  phase: Phase
  progress: number
  label: string
}

export function MorphTransition({
  phase,
  progress,
  label,
}: MorphTransitionProps) {
  const isVisible = phase !== 'idle'
  const path = buildMorphPath(phase, progress)

  return (
    <div
      aria-hidden="true"
      className={isVisible ? 'transition-overlay is-visible' : 'transition-overlay'}
    >
      <svg
        className="transition-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path className="transition-path" d={path} />
      </svg>
      <div className="transition-caption">
        <span>opening</span>
        <strong>{label}</strong>
      </div>
    </div>
  )
}
