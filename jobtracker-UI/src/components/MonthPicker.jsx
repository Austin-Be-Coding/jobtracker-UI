import React, { useState, useRef, useEffect } from 'react'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function MonthPicker({ value = '', onChange = () => {}, placeholder = 'Select month', className = '' }) {
  const ref = useRef(null)
  const [open, setOpen] = useState(false)

  // derive year/month from value (YYYY-MM)
  const match = (value || '').match(/^(\d{4})-(\d{2})$/)
  const initialYear = match ? parseInt(match[1], 10) : (new Date()).getFullYear()
  const initialMonthIdx = match ? (parseInt(match[2], 10) - 1) : null

  const [year, setYear] = useState(initialYear)
  const [monthIdx, setMonthIdx] = useState(initialMonthIdx)

  useEffect(() => {
    // sync when value changes externally
    const m = (value || '').match(/^(\d{4})-(\d{2})$/)
    if (m) {
      setYear(parseInt(m[1], 10))
      setMonthIdx(parseInt(m[2], 10) - 1)
    }
  }, [value])

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return
      if (!ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function handlePick(mIdx) {
    const mm = (mIdx + 1).toString().padStart(2, '0')
    const v = `${year}-${mm}`
    onChange(v)
    setOpen(false)
  }

  function clear() {
    onChange('')
    setOpen(false)
  }

  function setThisMonth() {
    const d = new Date()
    const v = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    onChange(v)
    setOpen(false)
  }

  const display = (() => {
    const m = (value || '').match(/^(\d{4})-(\d{2})$/)
    if (m) {
      const y = m[1]
      const mi = parseInt(m[2], 10) - 1
      const label = MONTH_NAMES[mi] || m[2]
      return `${label} ${y}`
    }
    return ''
  })()

  return (
    <div className={`month-picker ${className}`} ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" className="input-field" onClick={() => setOpen(s => !s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: display ? 'inherit' : '#888' }}>{display || placeholder}</span>
      </button>
      {open && (
        <div className="month-popover" role="dialog" aria-label="Select month">
          <div className="month-year-row">
            <button type="button" className="btn" onClick={() => setYear(y => y-1)}>&lt;</button>
            <div style={{ padding: '6px 12px', fontWeight: 700 }}>{year}</div>
            <button type="button" className="btn" onClick={() => setYear(y => y+1)}>&gt;</button>
          </div>
          <div className="month-grid">
            {MONTH_NAMES.map((m, i) => (
              <button key={m} type="button" className={`month-cell ${i === monthIdx && parseInt(year,10) === initialYear ? 'selected' : ''}`} onClick={() => handlePick(i)}>{m}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn" onClick={setThisMonth}>This month</button>
            <button type="button" className="btn btn-secondary" onClick={clear}>Clear</button>
          </div>
        </div>
      )}
    </div>
  )
}
