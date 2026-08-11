import React from 'react'
import './Time.css'

interface TimeProps {
  text_533_15?: string
  Mode?: string
  id?: string
  className?: string
  slot_1_127?: React.ReactNode
  slot_1_128?: React.ReactNode
}

export const Time = (props: TimeProps) => {
  const {
    text_533_15 = 'Ahora',
    Mode = 'Dark',
    id,
    className = '',
    slot_1_127,
    slot_1_128,
  } = props

  return (
    <div
      className={['component-1_124', className].filter(Boolean).join(' ')}
      id={id}
    >
      <div id="1_124" className="Pixso-symbol-1_124">
        {Mode === 'Dark' && (
          <div id="1_125" className="Pixso-symbol-1_125">
            {slot_1_127 ?? (
              <p id="1_127" className="Pixso-paragraph-1_127">
                {text_533_15 ?? 'Ahora'}
              </p>
            )}
          </div>
        )}
        {Mode === 'Light' && (
          <div id="1_126" className="Pixso-symbol-1_126">
            {slot_1_128 ?? (
              <p id="1_128" className="Pixso-paragraph-1_128">
                {text_533_15 ?? 'Ahora'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Time
