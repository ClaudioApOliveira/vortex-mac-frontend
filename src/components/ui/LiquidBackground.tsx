import './LiquidBackground.css'

export function LiquidBackground() {
  return (
    <div className="liquid-bg" aria-hidden="true">
      <div className="liquid-blob liquid-blob--1" />
      <div className="liquid-blob liquid-blob--2" />
      <div className="liquid-blob liquid-blob--3" />
      <div className="liquid-blob liquid-blob--4" />
      <div className="liquid-noise" />
    </div>
  )
}
