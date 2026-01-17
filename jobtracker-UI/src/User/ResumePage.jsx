import React, { useEffect, useState } from 'react'
import '../styles/main.css'
import { uploadResume, analyzeResume, getSuggestions, getUserResumes } from './resumeService'
import Markdown from 'react-markdown'

export default function ResumePage({ user } = {}) {
  const [file, setFile] = useState(null)
  const [resumeId, setResumeId] = useState(null)
  const [resumeFileName, setResumeFileName] = useState('')
  const [showUpload, setShowUpload] = useState(true)
  const [promptType, setPromptType] = useState('bullet_points')
  const [loading, setLoading] = useState(false)
  const [dots, setDots] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let t
    if (loading) {
      t = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 500)
    } else {
      setDots('')
    }
    return () => clearInterval(t)
  }, [loading])

// Load suggestion history when resumeId changes
//   useEffect(() => {
//     if (resumeId) loadHistory()
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [resumeId])

  // If a user is provided and already has uploaded resumes, load the most recent and hide upload UI
  useEffect(() => {
    let mounted = true
    async function discover() {
      // accept multiple possible id fields on the user object
      const uid = user?.id ?? user?.userId ?? user?._id ?? user?.uuid ?? user?.user_id
      try {
        const list = uid ? await getUserResumes(uid) : await getUserResumes()
        if (!mounted) return
        let r = null
        if (Array.isArray(list) && list.length > 0) {
          // API returned a list — assume newest-first
          r = list[0]
        } else if (list && typeof list === 'object') {
          // API returned a single resume object
          r = list
        }

        if (r) {
          setResumeId(r.id || r.resumeId || r._id)
          setResumeFileName(r.fileName || r.file_name || r.filename || '')
          setShowUpload(false)
        }
      } catch (e) {
        // ignore discovery errors; keep upload visible
        console.debug('Could not discover user resumes', e)
      }
    }
    // if we already have resumeId (from props or previous state) hide upload
    if (resumeId) {
      setShowUpload(false)
      return () => { mounted = false }
    }
    discover()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // whenever resumeId is set from elsewhere, ensure upload is hidden so Analyze shows
  useEffect(() => {
    if (resumeId) setShowUpload(false)
  }, [resumeId])

  async function handleFileChange(e) {
    setError('')
    const f = e.target.files && e.target.files[0]
    if (f) setFile(f)
  }

  async function handleUpload() {
    setError('')
    if (!file) return setError('Please select a PDF or DOCX file to upload.')
    try {
      setLoading(true)
      const res = await uploadResume(file, user?.id)
      // backend may return { resumeId } or { id } or a raw id
      const id = res.resumeId || res.id || res
      setResumeId(id)
      const fname = res.fileName || res.file_name || res.filename || ''
      if (fname) setResumeFileName(fname)
      // hide upload once uploaded
      setShowUpload(false)
    } catch (err) {
      setError(err?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyze() {
    setError('')
    if (!resumeId) return setError('Upload a resume first.')
    try {
      setLoading(true)
      // creative loading label is shown while this promise runs
      const suggestion = await analyzeResume(resumeId, promptType)
      // suggestion is expected to be the saved ResumeSuggestion object
      // mark as just added so we can animate it
      try { suggestion._justAdded = true } catch (e) {}
      setSuggestions((s) => [suggestion, ...s])
    } catch (err) {
      setError(err?.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  async function loadHistory() {
    try {
      const list = await getSuggestions(resumeId)
      setSuggestions(list || [])
    } catch (err) {
      console.error(err)
    }
  }

  // Clear temporary animation flags after they run
  useEffect(() => {
    if (!suggestions || suggestions.length === 0) return
    const t = setTimeout(() => {
      setSuggestions((prev) => prev.map((x) => ({ ...(x || {}), _justAdded: false })))
    }, 1200)
    return () => clearTimeout(t)
  }, [suggestions.length])

  function formatDate(d) {
    if (!d) return ''
    try {
      let dt = new Date(d)
      if (isNaN(dt.getTime())) {
        // try to trim excessive fractional seconds (ns -> ms)
        const fixed = ('' + d).replace(/\.(\d{3})\d*Z$/, '.$1Z')
        dt = new Date(fixed)
      }
      return isNaN(dt.getTime()) ? d : dt.toLocaleString()
    } catch (e) {
      return d
    }
  }

  function extractContent(s) {
    if (!s) return ''
    if (typeof s === 'string') return s
    return s.responseContent ?? s.response_content ?? s.response ?? s.content ?? JSON.stringify(s, null, 2)
  }

  return (
    <div style={{ padding: 18 }}>
      <h2 className="gradient-heading">Resume Analysis</h2>

      {showUpload ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
          <>
            <input type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} />
            <button className="cta-button" onClick={handleUpload} disabled={loading || !file}>
              Upload
            </button>
          </>

          {resumeId && <div style={{ color: '#444' }}>Resume ID: {resumeId}</div>}
        </div>
      ) : (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#5b3a00' }}>{resumeFileName || 'Your resume'}</div>
          {resumeId && <div style={{ color: '#666', marginTop: 6, textAlign: 'center' }}>Resume ID: {resumeId}</div>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* <label style={{ fontWeight: 700, color: '#5b3a00', marginRight: 6 }}>Prompt Type</label>
            <select value={promptType} onChange={(e) => setPromptType(e.target.value)} style={{ padding: 8, borderRadius: 6 }}>
              <option value="bullet_points">Bullet Points (achievements)</option>
              <option value="summary">Summary (career summary)</option>
              <option value="skills">Skills extraction</option>
              <option value="interview_questions">Interview questions</option>
            </select> */}

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="cta-button" onClick={handleAnalyze} disabled={loading || !resumeId}>
                Analyze
              </button>

              <button style={{ marginLeft: 0 }} onClick={() => setShowUpload(true)}>Replace</button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="suggestion-card suggestion-card--large" style={{ marginTop: 18, borderRadius: 8 }}>
          <div className="suggestion-content">
            <strong>Analyzing your experience{dots}</strong>
            <div style={{ marginTop: 8 }}>This may take a few moments while the career coach reviews your resume.</div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 12, color: 'crimson' }}>{error}</div>
      )}

      <div style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Analysis Results</h3>
        {suggestions.length === 0 && <div style={{ color: '#ffffffff' }}>No suggestions yet. Upload and analyze to get AI feedback.</div>}

        {suggestions.map((s, idx) => {
          const content = extractContent(s)
          const title = s.title || s.promptType || `Suggestion ${idx + 1}`
          const fileName = s.resume?.fileName || s.resume?.file_name || ''
          const created = formatDate(s.createdAt || s.created_at)
          return (
            <div key={s.id || idx} className="suggestion-card suggestion-card--large" style={{ marginBottom: 12, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, color: '#ffffffff', fontWeight: 700 }}>{title}</div>
                <div style={{ fontSize: 12, color: '#ffffff8a' }}>{fileName}</div>
              </div>
              <div className={s._justAdded ? 'suggestion-content' : 'suggestion-content'}>
                <div className="markdown-content" style={{ marginTop: 8 }}>
                  <Markdown>{content}</Markdown>
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: '#ffffff8f' }}>{created}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
