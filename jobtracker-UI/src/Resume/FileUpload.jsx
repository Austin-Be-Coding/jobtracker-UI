import React from 'react'

export default function FileUpload({ fileName, handleFile, handleSave, saveLabel = 'Save' }) {
  return (
    <>
      <label className="choose-file-btn">
        Upload resume
        <input id="resume-file-input" type="file" accept=".docx" onChange={handleFile} style={{ display: 'none' }} />
      </label>
      <div style={{ marginLeft: 'auto' }}>
        <button className="cta-button" onClick={handleSave}>
          {saveLabel}
        </button>
      </div>
    </>
  )
}
