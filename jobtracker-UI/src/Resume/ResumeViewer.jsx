import React, { useEffect, useState } from 'react'

export default function ResumeViewer({ user, onEdit }) {
  const [fetchedResume, setFetchedResume] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user || !user.id) return
      setLoading(true)
      setError(null)
      try {
        const q = `/api/resume/user/${encodeURIComponent(user.id)}`
        const res = await fetch(q)
        if (!res.ok) {
          if (!cancelled) setFetchedResume(null)
          return
        }
        const data = await res.json()
        // defensive: accept multiple response shapes from backend and normalize
        let raw = data
        // unwrap common wrappers
        if (raw && raw.data) raw = raw.data
        if (Array.isArray(raw) && raw.length) raw = raw[0]

        // possible shapes:
        // - { resumeForm: {...}, resumeId }
        // - { resume: { resumeForm: {...}, resumeId }, resumeId }
        // - { resumeForm: {...} } (direct)
        // - { name, email, experiences } (resumeForm directly)

        const extract = (obj) => {
          if (!obj) return null
          if (obj.resumeForm) return { resumeId: obj.resumeId || obj.id || null, resumeForm: obj.resumeForm }
          if (obj.resume && obj.resume.resumeForm) return { resumeId: obj.resume.resumeId || obj.resumeId || obj.id || null, resumeForm: obj.resume.resumeForm }
          if (obj.currentVersion && obj.currentVersion.resumeForm) return { resumeId: obj.resumeId || obj.resumeId || obj.id || null, resumeForm: obj.currentVersion.resumeForm }
          // if object already looks like a resume form (has name/email/skills or experiences), treat it as resumeForm
          const looksLikeForm = obj.name || obj.email || (Array.isArray(obj.experiences) && obj.experiences.length) || (Array.isArray(obj.education) && obj.education.length) || Array.isArray(obj.skills)
          if (looksLikeForm) return { resumeId: obj.resumeId || obj.id || null, resumeForm: obj }
          return null
        }

        const canonical = extract(raw)

        if (!cancelled) {
          console.debug('[ResumeViewer] fetched resume payload:', data, '=> canonical:', canonical)
          setFetchedResume(canonical || null)
        }
      } catch (e) {
        console.error('Failed to fetch latest resume', e)
        if (!cancelled) setError(e.message || 'Fetch error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user && user.id])

  function handleEditClick() {
    if (onEdit) onEdit(fetchedResume || null)
  }

  const r = fetchedResume && fetchedResume.resumeForm ? fetchedResume.resumeForm : null

  return (
    <div style={{ maxWidth: 920, margin: '12px auto', padding: 12, textAlign: 'left' }}>
      <h2 className="gradient-heading">Current Resume</h2>
      {loading && <div style={{ color: '#666' }}>Loading...</div>}
      {error && <div style={{ color: 'crimson' }}>Error: {error}</div>}
      {!loading && !r && !error && <div style={{ color: '#666' }}>No resume found for this user.</div>}

      {r && (
        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
          <div style={{ display: 'grid', gap: 8 }}>
          <div>
            <h1>{r.name}</h1>
            {r.email} | {r.phone}
          </div>
          {r.summary && (
            <div>
              <h2>Summary</h2>
              <div style={{ whiteSpace: 'pre-wrap' }}>{r.summary}</div>
            </div>
          )}

          {Array.isArray(r.experiences) && r.experiences.length > 0 && (
            <div>
              <h2>Experience</h2>
              {r.experiences.map((ex, i) => (
                <div key={i} style={{ marginTop: 8 }}>
                  <div>
                    <strong>{ex.title}</strong> — {ex.company} {ex.location ? `, ${ex.location}` : ''}
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    {ex.startDate} — {ex.current ? 'Present' : ex.endDate}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{ex.description}</div>
                </div>
              ))}
            </div>
          )}

          {Array.isArray(r.education) && r.education.length > 0 && (
            <div>
              <h2>Education</h2>
              {r.education.map((ed, i) => (
                <div key={i} style={{ marginTop: 8 }}>
                  <div>
                    <strong>{ed.school}</strong> — {ed.degree}
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    {ed.startDate} — {ed.current ? 'Present' : ed.endDate}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{ed.description}</div>
                </div>
              ))}
            </div>
          )}

          {Array.isArray(r.skills) && r.skills.length > 0 && (
            <div>
              <h2>Skills</h2>
              <div>{r.skills.join(', ')}</div>
            </div>
          )}
          </div>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <button className="cta-button" onClick={handleEditClick}>
          {r ? 'Edit' : 'Create'}
        </button>
      </div>
    </div>
  )
}
