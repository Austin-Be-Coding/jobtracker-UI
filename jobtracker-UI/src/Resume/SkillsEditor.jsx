import React from 'react'

export default function SkillsEditor({ skillsText, updateSkillsText, resumeForm }) {
  return (
    <>
      <textarea
        className="input-field auto-textarea"
        placeholder="Comma-separated skills"
        rows={3}
        value={skillsText}
        onChange={(e) => updateSkillsText(e.target.value)}
      />
      <div style={{ color: '#666', fontSize: 12 }}>
        Stored as an array: [{(resumeForm.skills || []).slice(0, 6).join(', ')}
        {(resumeForm.skills || []).length > 6 ? ', …' : ''}]
      </div>
    </>
  )
}
