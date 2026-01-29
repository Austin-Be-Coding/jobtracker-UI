import React from 'react'
import MonthPicker from '../components/MonthPicker'

export default function EducationItem({ idx, ed, updateEducation, removeEducation, eduFieldHasError }) {
  return (
    <div
      style={{
        border: '1px solid rgba(0,0,0,0.06)',
        padding: 8,
        marginTop: 8,
        borderRadius: 6
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <input
            className={`input-field ${eduFieldHasError(idx, 'school') ? 'error' : ''}`}
            placeholder="School"
            value={ed.school}
            onChange={(e) => updateEducation(idx, { school: e.target.value })}
            style={{ flex: 1 }}
          />
          {eduFieldHasError(idx, 'school') && <span style={{ color: 'crimson', fontWeight: 700 }}>*</span>}
        </div>
        <button type="button" onClick={() => removeEducation(idx)} style={{ padding: '8px 10px' }} title="Remove education">
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          className={`input-field ${eduFieldHasError(idx, 'degree') ? 'error' : ''}`}
          placeholder="Degree"
          value={ed.degree}
          onChange={(e) => updateEducation(idx, { degree: e.target.value })}
        />
        {eduFieldHasError(idx, 'degree') && <span style={{ color: 'crimson', fontWeight: 700 }}>*</span>}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MonthPicker
            className={`date-input ${eduFieldHasError(idx, 'start date') ? 'error' : ''}`}
            value={ed.startDate || ''}
            placeholder="Start (month)"
            onChange={(v) => updateEducation(idx, { startDate: v })}
          />
          {eduFieldHasError(idx, 'start date') && <span style={{ color: 'crimson', fontWeight: 700 }}>*</span>}
        </div>

        {!ed.current && (
          <MonthPicker className="date-input" value={ed.endDate || ''} placeholder="End (month)" onChange={(v) => updateEducation(idx, { endDate: v })} />
        )}

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={!!ed.current}
            onChange={(e) => updateEducation(idx, { current: e.target.checked, endDate: e.target.checked ? '' : ed.endDate })}
          />
          <span style={{ fontSize: 13 }}>Current</span>
        </label>
      </div>

      <textarea
        className="input-field auto-textarea"
        placeholder="Notes / coursework"
        rows={4}
        value={ed.description}
        onChange={(e) => updateEducation(idx, { description: e.target.value })}
      />
    </div>
  )
}
