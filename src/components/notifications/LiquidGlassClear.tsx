import './LiquidGlassClear.css'

interface LiquidGlassClearProps {
  id?: string
  className?: string
}

export const LiquidGlassClear = (props: LiquidGlassClearProps) => {
  const { id, className = '' } = props

  return (
    <div
      className={['component-1_109', className].filter(Boolean).join(' ')}
      id={id}
    >
      <div id="1_109" className="Pixso-symbol-1_109">
        <div id="1_110" className="Pixso-frame-1_110">
          <div className="shadow-blend-1_110-3"></div>
          <div className="shadow-blend-1_110-2"></div>
          <div className="shadow-blend-1_110-1"></div>
          <div className="shadow-blend-1_110-0"></div>
        </div>
        <div id="1_111" className="Pixso-frame-1_111"></div>
      </div>
    </div>
  )
}

export default LiquidGlassClear
