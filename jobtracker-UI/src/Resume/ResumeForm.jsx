import React from 'react'
import ExperienceItem from './ExperienceItem'
import EducationItem from './EducationItem'
import SkillsEditor from './SkillsEditor'
import FileUpload from './FileUpload'

export default function ResumeForm(props) {
  const {
    resumeForm,
    skillsText,
    message,
    fileName,
    handleFile,
    handleSave,
    saveLabel,
    updateTopField,
    updateExperience,
    addExperience,
    removeExperience,
    updateEducation,
    addEducation,
    removeEducation,
    updateSkillsText,
    topFieldHasError,
    expFieldHasError,
    eduFieldHasError
  } = props

  return (
    <div style={{ maxWidth: 920, margin: '12px auto', padding: 12 }}>
      <h2 className="gradient-heading">Resume</h2>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <FileUpload fileName={fileName} handleFile={handleFile} handleSave={handleSave} saveLabel={saveLabel} />
        <div style={{ marginLeft: 'auto' }}>
          {typeof props.onCancel === 'function' && (
            <button type="button" className="btn" onClick={props.onCancel} style={{ marginRight: 8 }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 8, color: '#888', wordWrap: 'break-word' }}>{message}</div>

      <div className="resume-panel" role="tabpanel">
        <div className="resume-form">
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                className={`input-field ${topFieldHasError('name') ? 'error' : ''}`}
                placeholder="Full name"
                value={resumeForm.name}
                onChange={(e) => updateTopField('name', e.target.value)}
              />
              {topFieldHasError('name') && <span style={{ color: 'crimson', fontWeight: 700 }}>*</span>}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                <input
                  className={`input-field ${topFieldHasError('email') ? 'error' : ''}`}
                  placeholder="Email"
                  value={resumeForm.email}
                  onChange={(e) => updateTopField('email', e.target.value)}
                />
                {topFieldHasError('email') && <span style={{ color: 'crimson', fontWeight: 700 }}>*</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                <input
                  className={`input-field ${topFieldHasError('phone') ? 'error' : ''}`}
                  placeholder="Phone"
                  value={resumeForm.phone}
                  onChange={(e) => updateTopField('phone', e.target.value)}
                />
                {topFieldHasError('phone') && <span style={{ color: 'crimson', fontWeight: 700 }}>*</span>}
              </div>
            </div>

            <textarea
              className="input-field auto-textarea"
              placeholder="Professional summary"
              rows={6}
              value={resumeForm.summary}
              onChange={(e) => updateTopField('summary', e.target.value)}
            />

            <div>
              <strong>Experience</strong>
              {resumeForm.experiences.length === 0 && <div style={{ color: '#666' }}>No experiences detected — add below.</div>}

              {resumeForm.experiences.map((ex, idx) => (
                <ExperienceItem
                  key={idx}
                  idx={idx}
                  ex={ex}
                  updateExperience={updateExperience}
                  removeExperience={removeExperience}
                  expFieldHasError={expFieldHasError}
                />
              ))}

              <div style={{ marginTop: 8 }}>
                <button className="cta-button" type="button" onClick={addExperience}>
                  Add experience
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <strong>Education</strong>
              {resumeForm.education.length === 0 && <div style={{ color: '#666' }}>No education detected — add below.</div>}

              {resumeForm.education.map((ed, idx) => (
                <EducationItem
                  key={idx}
                  idx={idx}
                  ed={ed}
                  updateEducation={updateEducation}
                  removeEducation={removeEducation}
                  eduFieldHasError={eduFieldHasError}
                />
              ))}

              <div style={{ marginTop: 8 }}>
                <button className="cta-button" type="button" onClick={addEducation}>
                  Add education
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <strong>Skills</strong>
              <SkillsEditor skillsText={skillsText} updateSkillsText={updateSkillsText} resumeForm={resumeForm} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
