import '@/styles/Speaker1.css'

interface Speaker1Props {
  id?: string
  className?: string
}

export default function Speaker1(props: Speaker1Props) {
  const { id, className = '' } = props

  return (
    <div
      className={['component-1_4', className].filter(Boolean).join(' ')}
      id={id}
    >
      <div id="1_4" className="stroke-wrapper-1_4">
        <div className="Pixso-symbol-1_4"></div>
        <div className="stroke-1_4"></div>
      </div>
    </div>
  )
}
