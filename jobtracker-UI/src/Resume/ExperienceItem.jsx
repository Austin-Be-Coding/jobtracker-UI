import React from 'react'
import MonthPicker from '../components/MonthPicker'

export default function ExperienceItem({ idx, ex, updateExperience, removeExperience, expFieldHasError }) {
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
            className={`input-field ${expFieldHasError(idx, 'title') ? 'error' : ''}`}
            placeholder="Title"
            value={ex.title}
            onChange={(e) => updateExperience(idx, { title: e.target.value })}
            style={{ flex: 1 }}
          />
          {expFieldHasError(idx, 'title') && <span style={{ color: 'crimson', fontWeight: 700 }}>*</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <input
            className={`input-field ${expFieldHasError(idx, 'company') ? 'error' : ''}`}
            placeholder="Company"
            value={ex.company || ''}
            onChange={(e) => updateExperience(idx, { company: e.target.value })}
            style={{ flex: 1 }}
          />
          {expFieldHasError(idx, 'company') && <span style={{ color: 'crimson', fontWeight: 700 }}>*</span>}
        </div>
        <input
          className="input-field"
          placeholder="Location (City, State or Remote)"
          value={ex.location || ''}
          onChange={(e) => updateExperience(idx, { location: e.target.value })}
          style={{ width: 220 }}
        />
        <button type="button" onClick={() => removeExperience(idx)} style={{ padding: '8px 10px' }} title="Remove experience">
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MonthPicker
            className={`date-input ${expFieldHasError(idx, 'start date') ? 'error' : ''}`}
            value={ex.startDate || ''}
            placeholder="Start (month)"
            onChange={(v) => updateExperience(idx, { startDate: v })}
          />
          {expFieldHasError(idx, 'start date') && <span style={{ color: 'crimson', fontWeight: 700 }}>*</span>}
        </div>
        {!ex.current && (
          <MonthPicker className="date-input" value={ex.endDate || ''} placeholder="End (month)" onChange={(v) => updateExperience(idx, { endDate: v })} />
        )}
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={!!ex.current}
            onChange={(e) => updateExperience(idx, { current: e.target.checked, endDate: e.target.checked ? '' : ex.endDate })}
          />
          <span style={{ fontSize: 13 }}>Current</span>
        </label>
      </div>

      <textarea
        className="input-field auto-textarea"
        placeholder="Description (bullets, achievements, scope)"
        rows={5}
        value={ex.description}
        onChange={(e) => updateExperience(idx, { description: e.target.value })}
      />
    </div>
  )
}
