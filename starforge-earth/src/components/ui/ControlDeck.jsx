import { motion } from 'framer-motion'

export function ControlDeck({ focusMode, onFocusChange, onRefresh }) {
  return (
    <motion.section
      className="panel panel-controls"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 130, damping: 16 }}
    >
      <div className="panel-header">
        <h1>Starforge Earth</h1>
        <p>实时地球信号台 / 科幻操作界面</p>
      </div>

      <div className="control-row">
        <button
          type="button"
          className={focusMode === 'orbit' ? 'active' : ''}
          onClick={() => onFocusChange('orbit')}
        >
          Orbit Focus
        </button>
        <button
          type="button"
          className={focusMode === 'overview' ? 'active' : ''}
          onClick={() => onFocusChange('overview')}
        >
          Wide Relay
        </button>
      </div>

      <motion.button
        type="button"
        className="refresh"
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 340, damping: 12 }}
        onClick={onRefresh}
      >
        Sync Open Data
      </motion.button>

      <div className="tip">
        滚轮缩放 / 拖动旋转地球，观测实时震动点与ISS链路。
      </div>
    </motion.section>
  )
}
