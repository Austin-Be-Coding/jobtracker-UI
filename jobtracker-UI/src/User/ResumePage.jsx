import React, { useEffect, useState } from 'react'
import '../styles/main.css'
import { uploadResume, analyzeResume, getSuggestions, getUserResumes, fetchResumeBlob } from './resumeService'
import DOMPurify from 'dompurify'

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
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isPdfPreview, setIsPdfPreview] = useState(false)

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
          // if backend returned a direct file URL, use it for preview
          const direct = r.url || r.fileUrl || r.file_url || r.downloadUrl || r.download_url
          if (direct) setPreviewUrl(direct)
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
      // if backend returned a direct file URL, set preview now
      const direct = res.url || res.fileUrl || res.file_url || res.downloadUrl || res.download_url
      if (direct) setPreviewUrl(direct)
      // hide upload once uploaded
      setShowUpload(false)
    } catch (err) {
      setError(err?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  // Load a preview blob when we have a resumeId but no direct preview URL
  useEffect(() => {
    let mounted = true
    let objectUrl = null
    async function loadPreview() {
      if (!resumeId) return
      if (previewUrl) return // already have a preview (direct URL)
      try {
        const blob = await fetchResumeBlob(resumeId)
        if (!mounted) return
        objectUrl = URL.createObjectURL(blob)
        setPreviewUrl(objectUrl)
        setIsPdfPreview(blob.type === 'application/pdf' || (resumeFileName || '').toLowerCase().endsWith('.pdf'))
      } catch (e) {
        // preview not available
      }
    }
    loadPreview()
    return () => {
      mounted = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId])

  async function handleAnalyze() {
    setError('')
    if (!resumeId) return setError('Upload a resume first.')
    try {
      setLoading(true)
      // creative loading label is shown while this promise runs
      let suggestion = await analyzeResume(resumeId, promptType)
      // suggestion is expected to be the saved ResumeSuggestion object
      // mark as just added so we can animate it
      try { suggestion._justAdded = true } catch (e) {}
      // normalize suggestion HTML: strip code fences if present and store cleaned HTML
      try {
        const raw = extractContent(suggestion)
        const cleaned = stripCodeFence(raw)
        if (suggestion.responseContent !== undefined) suggestion.responseContent = cleaned
        else if (suggestion.response_content !== undefined) suggestion.response_content = cleaned
        else if (suggestion.response !== undefined) suggestion.response = cleaned
        else if (suggestion.content !== undefined) suggestion.content = cleaned
        else suggestion.responseContent = cleaned
      } catch (e) {}
      setSuggestions((s) => [suggestion, ...s])
    } catch (err) {
      setError(err?.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  

  // Client-side PDF export using html2pdf.js loaded from CDN
  async function handleDownloadEditedResumePdf() {
    try {
      const normalized = normalizeFilename(resumeFileName)
      const title = normalized || 'edited_resume'

      // Build content
      const parts = (suggestions || []).map((s, i) => {
        const raw = extractContent(s)
        const safe = sanitizeSuggestionHtml(raw)
        return `<section class="suggestion-block" data-suggestion-index="${i}">${safe}</section>`
      })

      const wrapper = document.createElement('div')
      // keep element in DOM and renderable by html2canvas but keep it off-screen
      wrapper.style.position = 'fixed'
      wrapper.style.left = '0'
      wrapper.style.top = '0'
      wrapper.style.width = '800px'
      wrapper.style.transform = 'translateY(-12000px)'
      wrapper.style.opacity = '1'
      wrapper.style.zIndex = '9999'
      wrapper.style.background = '#fff'
      wrapper.innerHTML = `<div style="font-family:system-ui,Arial,Helvetica,sans-serif;color:#222;padding:24px"><h1>${escapeHtml(title)}</h1>${parts.join('\n')}</div>`
      document.body.appendChild(wrapper)

      // defensive: ensure we actually have content
      if (!wrapper.textContent || wrapper.textContent.trim().length === 0) {
        console.warn('PDF export: no content to render')
        wrapper.remove()
        throw new Error('No content to render for PDF')
      }

      // give browser a short moment to layout and load any webfonts/resources
      await new Promise((res) => setTimeout(res, 300))

      // load html2pdf if necessary
      if (typeof window.html2pdf === 'undefined') {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js'
          s.onload = resolve
          s.onerror = reject
          document.head.appendChild(s)
        })
      }

      // Use html2pdf to save
      const opt = {
        margin: 12,
        filename: `${title}-edited.pdf`,
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'pt', format: 'a4' }
      }
      try {
        // html2pdf attaches to window
        // @ts-ignore
        await window.html2pdf().set(opt).from(wrapper).save()
      } catch (e) {
        console.error('html2pdf failed', e)
        throw e
      }

      wrapper.remove()
    } catch (e) {
      console.error('PDF generation failed', e)
      // PDF generation failed; report error
    }
  }

  function escapeHtml(str) {
    if (!str) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  function normalizeFilename(name) {
    if (!name) return ''
    // strip path if any
    let base = name.split('/').pop().split('\\').pop()
    // remove extension
    base = base.replace(/\.[^.]+$/, '')
    // remove trailing space + parentheses like " (1)"
    base = base.replace(/\s*\(\d+\)$/, '')
    // trim
    base = base.trim()
    // fallback safe name
    return base || 'edited_resume'
  }

  async function loadHistory() {
    try {
      const list = await getSuggestions(resumeId)
      // normalize any fenced suggestion HTML before storing
      const cleaned = (list || []).map((s) => {
        try {
          const raw = extractContent(s)
          const out = { ...(s || {}) }
          const cleanedHtml = stripCodeFence(raw)
          if (out.responseContent !== undefined) out.responseContent = cleanedHtml
          else if (out.response_content !== undefined) out.response_content = cleanedHtml
          else if (out.response !== undefined) out.response = cleanedHtml
          else if (out.content !== undefined) out.content = cleanedHtml
          else out.responseContent = cleanedHtml
          return out
        } catch (e) {
          return s
        }
      })
      setSuggestions(cleaned)
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

  // Attach a single delegated click handler to support interactive change blocks
  // This version updates React state so accepted/rejected changes persist across rerenders.
  useEffect(() => {
    function applyChangeToHtml(html, id, action) {
      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html || '', 'text/html')
        // Prefer a wrapper element with class "change" and the data-change-id
        let container = doc.querySelector(`.change[data-change-id="${id}"]`)
        if (!container) {
          // Fallback: find any element with the data-change-id that actually contains the expected parts
          const candidates = doc.querySelectorAll(`[data-change-id="${id}"]`)
          for (const c of candidates) {
            if (c.querySelector('.orig') || c.querySelector('.suggest')) {
              container = c
              break
            }
          }
        }
        if (!container) return null

        const orig = container.querySelector('.orig')
        const suggest = container.querySelector('.suggest')
        const controls = container.querySelector('.controls')

        if (action === 'accept') {
          if (orig && suggest) {
            orig.textContent = suggest.textContent
            orig.style.background = 'transparent'
            orig.style.color = ''
            suggest.remove()
          }
          if (controls) controls.remove()
        } else if (action === 'reject') {
          if (suggest) suggest.remove()
          if (controls) controls.remove()
          if (orig) {
            orig.style.background = 'transparent'
            orig.style.color = ''
          }
        }

        return doc.body.innerHTML
      } catch (e) {
        return null
      }
    }

    function onClick(e) {
      const btn = e.target.closest('button[data-action]')
      if (!btn) return

      const id = btn.getAttribute('data-change-id')
      const action = btn.getAttribute('data-action')
      if (!id || !action) return

      // Update React state for suggestions by applying change to the HTML string
      setSuggestions((prev) => {
        let changed = false
        const next = (prev || []).map((s) => {
          const raw = extractContent(s)
          if (!raw || raw.indexOf(`data-change-id=\"${id}\"`) === -1) return s

          const updated = applyChangeToHtml(raw, id, action)
          if (!updated) return s
          changed = true
          const out = { ...(s || {}) }
          // write back into the same property if exists, prefer responseContent keys
          if (out.responseContent !== undefined) out.responseContent = updated
          else if (out.response_content !== undefined) out.response_content = updated
          else if (out.response !== undefined) out.response = updated
          else if (out.content !== undefined) out.content = updated
          else out.responseContent = updated
          return out
        })
        return changed ? next : prev
      })
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

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

    // Remove Markdown code fences like ```html ... ``` that some models emit
    function stripCodeFence(html) {
      if (!html || typeof html !== 'string') return html || ''
      // remove leading ```lang or ``` and trailing ```
      let out = html.replace(/^[\s\S]*?```[a-zA-Z0-9+-]*\s*/, (m) => {
        // If the string starts with a fence, drop it; otherwise keep original
        return m.startsWith('```') ? '' : m
      })
      // remove trailing fence if present
      out = out.replace(/\s*```\s*$/g, '')
      return out
    }

    function sanitizeSuggestionHtml(html) {
      const cleaned = stripCodeFence(html || '')
      return DOMPurify.sanitize(cleaned, {
        ALLOWED_TAGS: ['div','span','p','h1','h2','h3','ul','ol','li','hr','br','strong','em','b','i','button'],
        ALLOWED_ATTR: ['class','style','data-change-id','data-action','type']
      })
    }

  return (
    <div style={{ padding: 18 }}>
      <h2 className="gradient-heading">Resume Analysis</h2>

      {showUpload ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12, flexDirection: 'column' }}>
          <h3 style={{ marginBottom: 8 }}>Upload your resume and analyze to get AI feedback.</h3>
          {!file ? (
            <>
              <input id="resume-file-input" type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} style={{ display: 'none' }} />
              <label htmlFor="resume-file-input" className="choose-file-btn">Choose File</label>
            </>
          ) : (
            <>
              <div style={{ color: '#444', fontWeight: 600 }}>{file.name}</div>
              <button className="cta-button" onClick={handleUpload} disabled={loading}>
                {loading ? 'Uploading…' : 'Upload'}
              </button>
              <button onClick={() => setFile(null)}>Choose different</button>
            </>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#5b3a00' }}>{resumeFileName || 'Your resume'}</div>
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
              <button style={{ marginLeft: 8 }} onClick={handleDownloadEditedResumePdf} className="cta-button">Download PDF</button>
            </div>
          </div>
          {/* Preview window */}
          {/* <div style={{ marginTop: 16 }}>
            {previewUrl ? (
              isPdfPreview ? (
                <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                  <iframe title="resume-preview" src={previewUrl} style={{ width: '100%', height: 480, border: 0 }} />
                </div>
              ) : (
                <div style={{ color: '#333' }}>
                  <div style={{ marginBottom: 8 }}>Preview not available for this file type.</div>
                  <a href={previewUrl} target="_blank" rel="noreferrer">Open / Download resume</a>
                </div>
              )
            ) : (
              <div style={{ color: '#777' }}>No preview available.</div>
            )}
          </div> */}
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
       
        {suggestions.map((s, idx) => {
          const content = extractContent(s)
          const title = s.title || s.promptType || `Suggestion ${idx + 1}`
          const fileName = s.resume?.fileName || s.resume?.file_name || ''
          const created = formatDate(s.createdAt || s.created_at)
            return (
              <div key={s.id || idx} className="suggestion-card suggestion-card--large" style={{ marginBottom: 12, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* <div style={{ fontSize: 14, color: '#ffffffff', fontWeight: 700 }}>{title}</div>
                <div style={{ fontSize: 12, color: '#ffffff8a' }}>{fileName}</div> */}
              </div>
              <div className={s._justAdded ? 'suggestion-content' : 'suggestion-content'}>
                <div className="markdown-content" style={{ marginTop: 8 }} dangerouslySetInnerHTML={{ __html: sanitizeSuggestionHtml(content) }} />
                <div style={{ marginTop: 12, fontSize: 12, color: '#ffffff8f' }}>{created}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
