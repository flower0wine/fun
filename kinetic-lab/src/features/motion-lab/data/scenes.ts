export type SceneDefinition = {
  id: string
  title: string
  summary: string
  status: 'ready' | 'draft'
  stack: string[]
}

export const scenes: SceneDefinition[] = [
  {
    id: 'click-pulse-button',
    title: 'Click Pulse Button',
    summary: '点击时出现按压形变、回弹和能量涟漪，适合作为交互按钮基底。',
    status: 'ready',
    stack: ['framer-motion', 'motion values'],
  },
  {
    id: 'orbital-ribbons',
    title: 'Orbital Ribbons',
    summary: '适合做轨道漂浮、层叠光带、延迟错位等空间动效。',
    status: 'ready',
    stack: ['framer-motion', 'css variables'],
  },
  {
    id: 'liquid-panels',
    title: 'Liquid Panels',
    summary: '预留给流体挤压、玻璃扭曲和 hover 形变卡片效果。',
    status: 'draft',
    stack: ['svg filters', 'pointer tracking'],
  },
  {
    id: 'signal-tunnel',
    title: 'Signal Tunnel',
    summary: '预留给重复节拍、透视隧道和音频响应类实验。',
    status: 'draft',
    stack: ['timeline orchestration', 'canvas'],
  },
]
