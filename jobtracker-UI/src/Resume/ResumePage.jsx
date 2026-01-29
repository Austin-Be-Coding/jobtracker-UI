import React, { useState, useEffect, useMemo } from 'react'
import DOMPurify from 'dompurify'
import mammoth from 'mammoth'
import '../styles/main.css'
import MonthPicker from '../components/MonthPicker'
import ResumeForm from './ResumeForm'
import ResumeViewer from './ResumeViewer'

export default function ResumePage({ user } = {}) {
  const [fileName, setFileName] = useState('')
  const [html, setHtml] = useState('')
  const [plainText, setPlainText] = useState('')
  const [resumeJson, setResumeJson] = useState(null)
  const [message, setMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState([])

  // Canonical “source of truth” (UPDATED: skills is array)
  const [resumeForm, setResumeForm] = useState({
    name: '',
    email: '',
    phone: '',
    summary: '',
    experiences: [],
    education: [],
    skills: [] // <-- array
  })

  const [isEditing, setIsEditing] = useState(user && user.id ? false : true)
  const [currentResume, setCurrentResume] = useState(null)

  // UI helper: keep a textarea string view of skills
  const skillsText = useMemo(() => (resumeForm.skills || []).join(', '), [resumeForm.skills])

  // auto-resize textareas to fit content whenever the form changes
  useEffect(() => {
    try {
      const els = document.querySelectorAll('.auto-textarea')
      els.forEach((el) => {
        if (!(el instanceof HTMLElement)) return
        el.style.height = 'auto'
        el.style.height = el.scrollHeight + 'px'
        el.style.overflow = 'hidden'
      })
    } catch (e) {}
  }, [resumeForm])

  // resume viewer now handles fetching; isEditing controls display

  // ---------- Normalization helpers ----------
  function normalizeSpaces(s) {
    return (s || '').replace(/\s+/g, ' ').trim()
  }

  function normalizeMultiline(s) {
    // preserve newlines, but clean each line + collapse excessive blank lines
    const lines = String(s || '')
      .split('\n')
      .map((l) => l.replace(/\s+/g, ' ').trim())
    return lines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  function normalizePhone(s) {
    // keep original formatting mostly, just trim and collapse spaces
    return normalizeSpaces(s || '')
  }

  function normalizeEmail(s) {
    return (s || '').trim()
  }

  function normalizeIsoMonth(s) {
    const t = (s || '').trim()
    if (!t) return ''
    if (/^\d{4}-\d{2}$/.test(t)) return t
    return '' // MonthPicker should already enforce YYYY-MM
  }

  function parseSkillsTextToArray(text) {
    // split on commas, semicolons, newlines
    const raw = String(text || '')
      .split(/[,;\n]+/g)
      .map((x) => x.trim())
      .filter(Boolean)

    // de-dupe case-insensitive, keep first casing
    const seen = new Set()
    const out = []
    for (const item of raw) {
      const key = item.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(item)
    }
    return out
  }

  function normalizeResumeForm(form) {
    const f = form || {}

    const experiences = (Array.isArray(f.experiences) ? f.experiences : []).map((ex) => {
      const current = !!ex.current
      const startDate = normalizeIsoMonth(ex.startDate || '')
      let endDate = normalizeIsoMonth(ex.endDate || '')

      if (current) endDate = '' // enforce rule

      return {
        title: normalizeSpaces(ex.title || '') || '',
        company: normalizeSpaces(ex.company || '') || '',
        location: normalizeSpaces(ex.location || '') || '',
        startDate,
        endDate,
        current,
        description: normalizeMultiline(ex.description || '') || ''
      }
    })

    const education = (Array.isArray(f.education) ? f.education : []).map((ed) => {
      const current = !!ed.current
      const startDate = normalizeIsoMonth(ed.startDate || '')
      let endDate = normalizeIsoMonth(ed.endDate || '')

      if (current) endDate = ''

      return {
        school: normalizeSpaces(ed.school || '') || '',
        degree: normalizeSpaces(ed.degree || '') || '',
        location: normalizeSpaces(ed.location || '') || '',
        startDate,
        endDate,
        current,
        description: normalizeMultiline(ed.description || '') || ''
      }
    })

    const skillsArr = Array.isArray(f.skills) ? f.skills : parseSkillsTextToArray(f.skills || '')
    const skills = parseSkillsTextToArray(skillsArr.join(', ')) // normalize/dedupe again

    return {
      name: normalizeSpaces(f.name || '') || '',
      email: normalizeEmail(f.email || '') || '',
      phone: normalizePhone(f.phone || '') || '',
      summary: normalizeMultiline(f.summary || '') || '',
      skills,
      experiences,
      education
    }
  }

  // ---------- Safe immutable update helpers ----------
  function updateTopField(key, value) {
    setResumeForm((s) => ({ ...s, [key]: value }))
    clearErrorsForKeywords([key])
  }

  function updateExperience(idx, patch) {
    setResumeForm((s) => {
      const experiences = (s.experiences || []).map((x, i) => (i === idx ? { ...x, ...patch } : x))
      return { ...s, experiences }
    })
    const fields = Object.keys(patch || {})
    if (fields.length) clearExperienceErrors(idx, fields)
  }

  function addExperience() {
    setResumeForm((s) => ({
      ...s,
      experiences: [
        ...(s.experiences || []),
        { title: '', company: '', startDate: '', endDate: '', current: false, location: '', description: '' }
      ]
    }))
  }

  function removeExperience(idx) {
    setResumeForm((s) => ({
      ...s,
      experiences: (s.experiences || []).filter((_, i) => i !== idx)
    }))
  }

  function updateEducation(idx, patch) {
    setResumeForm((s) => {
      const education = (s.education || []).map((x, i) => (i === idx ? { ...x, ...patch } : x))
      return { ...s, education }
    })
    const fields = Object.keys(patch || {})
    if (fields.length) clearEducationErrors(idx, fields)
  }

  function addEducation() {
    setResumeForm((s) => ({
      ...s,
      education: [
        ...(s.education || []),
        { school: '', degree: '', location: '', startDate: '', endDate: '', current: false, description: '' }
      ]
    }))
  }

  function removeEducation(idx) {
    setResumeForm((s) => ({
      ...s,
      education: (s.education || []).filter((_, i) => i !== idx)
    }))
  }

  function updateSkillsText(value) {
    setResumeForm((s) => ({
      ...s,
      skills: parseSkillsTextToArray(value)
    }))
    clearErrorsForKeywords(['skills'])
  }

  // ---------- Parsing helpers ----------
  const ALLOWED_TAGS = useMemo(
    () => [
      'p',
      'div',
      'span',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'strong',
      'em',
      'b',
      'i',
      'u',
      'br',
      'table',
      'thead',
      'tbody',
      'tr',
      'td',
      'th'
    ],
    []
  )
  const ALLOWED_ATTR = useMemo(() => ['href', 'src', 'alt'], [])

  function extractContactFromTop(text) {
    const contact = { email: '', phone: '' }
    try {
      const top = (text || '').slice(0, 1200)
      const emailMatch = top.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)
      const phoneMatch = top.match(/(\+?\d[\d\-\s().]{6,}\d)/)
      if (emailMatch) contact.email = emailMatch[0]
      if (phoneMatch) contact.phone = phoneMatch[0]
    } catch (e) {}
    return contact
  }

  function isHeadingNode(n) {
    return n?.nodeType === 1 && /^H[1-6]$/.test(n.tagName)
  }

  function nodeText(n) {
    return (n?.textContent || '').trim()
  }

  function looksLikeHeadingByStyle(n) {
    if (!n || n.nodeType !== 1) return false
    const tag = n.tagName
    if (tag !== 'P' && tag !== 'DIV') return false

    const txt = nodeText(n)
    if (!txt) return false
    if (txt.length > 60) return false

    const letters = txt.replace(/[^A-Za-z]/g, '')
    const isAllCaps = letters.length >= 3 && letters === letters.toUpperCase()

    const strongText = Array.from(n.querySelectorAll('strong,b'))
      .map((el) => (el.textContent || '').trim())
      .join(' ')
    const strongLen = strongText.replace(/\s+/g, '').length
    const totalLen = txt.replace(/\s+/g, '').length
    const boldRatio = totalLen ? strongLen / totalLen : 0

    return boldRatio >= 0.7 || (isAllCaps && txt.split(/\s+/).length <= 6)
  }

  const MONTHS =
    '(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'

  const dateRangeRe = useMemo(
    () =>
      new RegExp(
        `\\b(?:${MONTHS}\\s+\\d{4}|\\d{4})\\s*(?:-|–|—|to)\\s*(?:${MONTHS}\\s+\\d{4}|\\d{4}|Present|Current)\\b`,
        'i'
      ),
    []
  )

  function looksLikeEntryHeader(text) {
    const t = (text || '').toLowerCase()
    if (!t) return false
    if (/\s+at\s+/.test(t)) return true
    if (dateRangeRe.test(text)) return true
    if (/\b(remote|hybrid|onsite)\b/.test(t) && /,/.test(t)) return true
    return false
  }

  const headingMap = useMemo(
    () => ({
      experience: ['experience', 'professional experience', 'work experience', 'employment', 'employment history', 'work history'],
      education: ['education', 'academic', 'education & training', 'academic background'],
      skills: ['skills', 'technical skills', 'expertise', 'technologies', 'languages'],
      summary: ['summary', 'profile', 'professional summary', 'about', 'objective'],
      projects: ['projects', 'personal projects', 'selected projects', 'project'],
      certifications: ['certifications', 'licenses', 'credential'],
      awards: ['awards', 'honors', 'recognition'],
      publications: ['publications', 'papers', 'articles'],
      volunteering: ['volunteer', 'volunteering', 'community']
    }),
    []
  )

  const SECTION_WRAPPERS = useMemo(
    () => ({
      EXPERIENCE: /(employment history|work history|experience)/i,
      EDUCATION: /(education)/i,
      SKILLS: /(skills|technical skills)/i,
      SUMMARY: /(professional summary|summary|profile|objective)/i
    }),
    []
  )

  function sectionWrapperOverride(heading) {
    if (!heading) return null
    for (const [label, re] of Object.entries(SECTION_WRAPPERS)) {
      if (re.test(heading)) return label
    }
    return null
  }

  function scoreBlockLabel(b, labelKey) {
    let score = 0
    const heading = (b.heading || '').toLowerCase()
    const body = (b.bodyText || '').toLowerCase()

    const synonyms = headingMap[labelKey] || []
    synonyms.forEach((s) => {
      if (heading.includes(s)) score += 10
    })

    if (labelKey === 'experience') {
      if (/\b\d{4}\b/.test(body)) score += 3
      if ((b.bulletCount || 0) >= 2) score += 3
      if (/\b(company|inc|llc|ltd|co\.|corporation|consultant)\b/.test(body)) score += 2
    }

    if (labelKey === 'education') {
      if (/\b(university|college|institute|school|bachelor'?s?|master'?s?|phd|doctorate|coursework)\b/i.test(body)) score += 4
      if (/\b(bachelor'?s?|master'?s?|phd|doctorate|b\.s\.?|b\.a\.?|m\.s\.?|m\.a\.?|mba)\b/i.test(heading)) score += 8
    }

    if (labelKey === 'skills') {
      if (/\b(languages|tools|frameworks|technologies|skills|platforms)\s*:/i.test(body)) score += 4
      const commaCount = (b.bodyText || '').split(',').length - 1
      if (commaCount >= 3) score += 2
    }

    if (labelKey === 'summary') {
      if (b.heading && b.heading.length < 60) score += 2
      if (body.length > 80 && body.length < 600) score += 2
    }

    if ((b.bulletCount || 0) > 0 && (labelKey === 'experience' || labelKey === 'projects')) score += 1

    return score
  }

  function computeConfidence(bestScore, secondScore) {
    const margin = bestScore - secondScore
    if (bestScore >= 16 && margin >= 6) return 0.9
    if (bestScore >= 12 && margin >= 4) return 0.75
    if (bestScore >= 8 && margin >= 2) return 0.6
    return 0.45
  }

  function classifyBlock(b) {
    const h = (b.heading || '').trim()
    const joined = (h + '\n' + (b.bodyText || '')).trim()

    const wrapper = sectionWrapperOverride(h)
    if (wrapper) return { label: wrapper, score: 999, confidence: 1 }

    if (/education/i.test(b.sectionHeading || '')) return { label: 'EDUCATION', score: 999, confidence: 1 }

    const scores = {}
    Object.keys(headingMap).forEach((k) => {
      scores[k] = scoreBlockLabel(b, k)
    })

    if (dateRangeRe.test(joined) || /\s+at\s+.+/i.test(h)) scores.experience = (scores.experience || 0) + 14

    const hasSchool = /\b(university|college|institute|school)\b/i.test(joined)
    const hasDegree = /\b(bachelor'?s?|master'?s?|phd|doctorate|b\.s\.?|b\.a\.?|m\.s\.?|m\.a\.?|mba)\b/i.test(joined)
    if (hasSchool || hasDegree) scores.education = (scores.education || 0) + 18

    const headingLower = h.toLowerCase()
    if (headingLower.includes('summary') || headingLower.includes('profile') || headingLower.includes('objective')) {
      scores.summary = (scores.summary || 0) + 12
    }

    let bestKey = 'other'
    let bestScore = -Infinity
    let secondScore = -Infinity
    Object.keys(scores).forEach((k) => {
      const s = scores[k] || 0
      if (s > bestScore) {
        secondScore = bestScore
        bestScore = s
        bestKey = k
      } else if (s > secondScore) {
        secondScore = s
      }
    })

    return { label: bestKey.toUpperCase(), score: bestScore, confidence: computeConfidence(bestScore, secondScore) }
  }

  function splitExperienceEntries(block) {
    if (!block?.bodyHtml) return []

    const d = new DOMParser().parseFromString(`<div>${block.bodyHtml}</div>`, 'text/html')
    const root = d.body.firstChild
    const children = Array.from(root.childNodes).filter((n) => {
      if (n.nodeType === 3) return (n.textContent || '').trim().length > 0
      return true
    })

    function nodeAsText(n) {
      return normalizeSpaces(n?.textContent || '')
    }

    function isJobHeaderNode(n) {
      if (n.nodeType !== 1) return false
      if (n.tagName !== 'P' && n.tagName !== 'DIV') return false
      const strong = n.querySelector?.('strong, b')
      if (!strong) return false
      const t = nodeAsText(strong)
      if (!t) return false
      return /\s+at\s+/.test(t.toLowerCase()) || /\b(remote|hybrid|onsite)\b/i.test(t)
    }

    function isDateLineNode(n) {
      if (n.nodeType !== 1) return false
      if (n.tagName !== 'P' && n.tagName !== 'DIV') return false
      const t = nodeAsText(n)
      if (!t) return false
      return dateRangeRe.test(t) || (/\b(19|20)\d{2}\b/.test(t) && /\b(present|current)\b/i.test(t))
    }

    function parseHeaderLine(headerLine) {
      const out = { title: '', company: '', location: '', workMode: '' }
      const s = (headerLine || '').trim()

      const wm = s.match(/\((remote|hybrid|onsite)\)/i)
      if (wm) out.workMode = wm[1]

      const parts = s.split(/\s+at\s+/i)
      if (parts.length >= 2) {
        out.title = parts[0].trim()
        const rhs = parts.slice(1).join(' at ').trim()
        const rhsNoMode = rhs.replace(/\s*\((remote|hybrid|onsite)\)\s*$/i, '').trim()
        const commaParts = rhsNoMode.split(',').map((x) => x.trim()).filter(Boolean)
        if (commaParts.length >= 2) {
          out.company = commaParts[0]
          out.location = commaParts.slice(1).join(', ')
        } else {
          out.company = rhsNoMode
        }
      } else {
        const dashSplit = s.split(/\s+[–—\-\|]\s+/).map((x) => x.trim()).filter(Boolean)
        if (dashSplit.length >= 2) {
          out.title = dashSplit[0]
          out.company = dashSplit.slice(1).join(' - ')
        } else {
          out.title = s
        }
      }

      return out
    }

    const entries = []
    let i = 0

    while (i < children.length) {
      const n = children[i]
      if (!isJobHeaderNode(n)) {
        i++
        continue
      }

      const strong = n.querySelector('strong, b')
      const headerLine = nodeAsText(strong)

      let dateLine = ''
      if (i + 1 < children.length && isDateLineNode(children[i + 1])) {
        dateLine = nodeAsText(children[i + 1])
      }

      const descNodes = []
      let j = i + 1
      if (dateLine) j++

      while (j < children.length && !isJobHeaderNode(children[j])) {
        descNodes.push(children[j].cloneNode(true))
        j++
      }

      const tmp = document.createElement('div')
      descNodes.forEach((x) => tmp.appendChild(x))

      const descText = (tmp.textContent || '').trim()
      const parsed = parseHeaderLine(headerLine)

      entries.push({
        id: `${block.id}_job${entries.length + 1}`,
        section: 'EXPERIENCE',
        entryHeading: headerLine,
        title: parsed.title,
        company: parsed.company,
        location: parsed.location || (parsed.workMode ? parsed.workMode : ''),
        workMode: parsed.workMode,
        dateRange: dateLine || '',
        bodyText: descText
      })

      i = j
    }

    return entries.filter((e) => (e.bodyText || '').length > 0 || (e.title || '').length > 0)
  }

  function splitEducationEntries(block) {
    const h = (block.heading || '').trim()
    const sh = (block.sectionHeading || '').trim()
    const bodyText = (block.bodyText || '').trim()

    const schoolHint = (s) => /\b(university|college|institute|school)\b/i.test(s || '')
    const degreeHint = (s) => /\b(bachelor'?s?|master'?s?|phd|doctorate|b\.s\.?|b\.a\.?|m\.s\.?|m\.a\.?|mba)\b/i.test(s || '')

    let school = ''
    let degree = ''

    if (schoolHint(sh)) school = sh
    else if (schoolHint(h)) school = h

    if (degreeHint(h) && !degreeHint(sh)) degree = h
    else if (degreeHint(sh) && !degreeHint(h)) degree = sh
    else if (!degree && !school) {
      degree = h
      school = sh
    } else {
      if (school && !degree) degree = school === h ? sh : h
    }

    const dateMatch =
      bodyText.slice(0, 250).match(dateRangeRe) ||
      bodyText.match(/\b(19|20)\d{2}\s*(?:-|–|—|to)\s*(19|20)\d{2}\b/)

    return [
      {
        id: `${block.id}_edu1`,
        section: 'EDUCATION',
        school: (school || '').trim(),
        degree: (degree || '').trim(),
        dateRange: dateMatch ? dateMatch[0] : '',
        bodyText
      }
    ]
  }

  function parseMonthValue(s) {
    if (!s) return ''
    const t = (s || '').trim()
    const isoMonth = t.match(/^(\d{4})-(\d{2})$/)
    if (isoMonth) return `${isoMonth[1]}-${isoMonth[2]}`
    const isoYear = t.match(/^(\d{4})$/)
    if (isoYear) return `${isoYear[1]}-01`

    const m = t.match(
      /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+([0-9]{4})/i
    )
    if (m) {
      const months = {
        jan: '01',
        feb: '02',
        mar: '03',
        apr: '04',
        may: '05',
        jun: '06',
        jul: '07',
        aug: '08',
        sep: '09',
        sept: '09',
        oct: '10',
        nov: '11',
        dec: '12'
      }
      const key = m[1].slice(0, 3).toLowerCase()
      const mm = months[key] || '01'
      return `${m[2]}-${mm}`
    }

    const y = t.match(/(19|20)\d{2}/)
    if (y) return `${y[0]}-01`
    return ''
  }

  function parseDateRange(dr) {
    const out = { startDate: '', endDate: '', current: false }
    if (!dr) return out
    const txt = (dr || '').trim()
    if (/\b(present|current)\b/i.test(txt)) out.current = true
    const parts = txt
      .split(/\s*(?:-|–|—|to)\s*/i)
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length >= 1) out.startDate = parseMonthValue(parts[0]) || ''
    if (parts.length >= 2) out.endDate = out.current ? '' : parseMonthValue(parts[1]) || ''
    return out
  }

  function populateFormFromSkeleton(skel, contact) {
    const f = {
      name: '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      summary: '',
      experiences: [],
      education: [],
      skills: []
    }

    const summaryIds = (skel?.groups && skel.groups.SUMMARY) || []
    if (summaryIds.length) {
      const summaryBlocks = summaryIds
        .map((id) => (skel.blocks || []).find((b) => b.id === id))
        .filter(Boolean)
      f.summary = summaryBlocks.map((b) => (b.bodyText || '').trim()).join('\n\n').slice(0, 1200)
    }

    const exp = (skel?.entries && skel.entries.EXPERIENCE) || []
    for (const e of exp) {
      const dr = parseDateRange(e.dateRange || '')
      const title = (e.title || '').trim() || (e.entryHeading || '').trim()
      const company = (e.company || '').trim()
      const location = (e.location || '').trim()

      f.experiences.push({
        title,
        company,
        startDate: dr.startDate || '',
        endDate: dr.endDate || '',
        current: !!dr.current,
        location,
        description: (e.bodyText || '').trim()
      })
    }

    const eds = (skel?.entries && skel.entries.EDUCATION) || []
    for (const ed of eds) {
      const dr = parseDateRange(ed.dateRange || '')
      f.education.push({
        school: ed.school || '',
        degree: ed.degree || '',
        location: '',
        startDate: dr.startDate || '',
        endDate: dr.endDate || '',
        current: !!dr.current,
        description: ed.bodyText || ''
      })
    }

    // skills -> array
    if (skel?.entries && Array.isArray(skel.entries.SKILLS) && skel.entries.SKILLS.length) {
      const raw = skel.entries.SKILLS.map((s) => s.bodyText || '').join(', ')
      f.skills = parseSkillsTextToArray(raw)
    } else if (skel?.groups && skel.groups.SKILLS) {
      const ids = skel.groups.SKILLS || []
      const raw = ids
        .map((id) => ((skel.blocks || []).find((x) => x.id === id) || {}).bodyText || '')
        .filter(Boolean)
        .join(', ')
      f.skills = parseSkillsTextToArray(raw)
    }

    return f
  }

  // Validate resumeForm before saving (VALIDATES ARRAY SKILLS + DATE RULES)
  function validateResumeForm(f) {
    const errs = []
    if (!f) return ['Missing form']

    if (!f.name || !(f.name || '').trim()) errs.push('Name is required')

    const email = (f.email || '').trim()
    if (!email) errs.push('Email is required')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Email is invalid')

    const phone = (f.phone || '').trim()
    if (!phone) errs.push('Phone is required')
    else if (!/(?:\+?\d[\d\-\s().]{6,}\d)/.test(phone)) errs.push('Phone is invalid')

    const hasExp = Array.isArray(f.experiences) && f.experiences.length > 0
    const hasEdu = Array.isArray(f.education) && f.education.length > 0
    if (!hasExp && !hasEdu) errs.push('Add at least one Experience or Education entry')

    // Skills (optional, but if provided, enforce array strings)
    if (f.skills != null) {
      const arr = Array.isArray(f.skills) ? f.skills : []
      const bad = arr.some((x) => typeof x !== 'string' || !x.trim())
      if (bad) errs.push('Skills contains invalid entries')
    }

    if (hasExp) {
      f.experiences.forEach((ex, i) => {
        const ix = i + 1
        if (!ex.title || !(ex.title || '').trim()) errs.push(`Experience ${ix}: title is required`)
        if (!ex.company || !(ex.company || '').trim()) errs.push(`Experience ${ix}: company is required`)
        if (!ex.startDate || !(ex.startDate || '').trim()) errs.push(`Experience ${ix}: start date is required`)
        if (ex.startDate && !/^\d{4}-\d{2}$/.test(ex.startDate)) errs.push(`Experience ${ix}: start date must be YYYY-MM`)
        if (ex.current && ex.endDate) errs.push(`Experience ${ix}: end date must be blank when current`)
        if (ex.endDate && !/^\d{4}-\d{2}$/.test(ex.endDate)) errs.push(`Experience ${ix}: end date must be YYYY-MM`)
      })
    }

    if (hasEdu) {
      f.education.forEach((ed, i) => {
        const ix = i + 1
        if (!ed.school || !(ed.school || '').trim()) errs.push(`Education ${ix}: school is required`)
        if (!ed.degree || !(ed.degree || '').trim()) errs.push(`Education ${ix}: degree is required`)
        if (ed.startDate && !/^\d{4}-\d{2}$/.test(ed.startDate)) errs.push(`Education ${ix}: start date must be YYYY-MM`)
        if (ed.current && ed.endDate) errs.push(`Education ${ix}: end date must be blank when current`)
        if (ed.endDate && !/^\d{4}-\d{2}$/.test(ed.endDate)) errs.push(`Education ${ix}: end date must be YYYY-MM`)
      })
    }

    return errs
  }

  // helpers for validation UI
  function clearErrorsForKeywords(keys = []) {
    if (!keys || keys.length === 0) return
    setValidationErrors((prev) =>
      prev.filter((err) => {
        const low = String(err || '').toLowerCase()
        return !keys.some((k) => low.indexOf((k || '').toLowerCase()) !== -1)
      })
    )
  }

  function clearExperienceErrors(idx, fields = []) {
    if (!fields || fields.length === 0) return
    const token = (f) => {
      if (!f) return f
      if (f === 'startDate') return 'start date'
      if (f === 'endDate') return 'end date'
      return f.replace(/([A-Z])/g, ' $1').toLowerCase()
    }
    setValidationErrors((prev) =>
      prev.filter((err) => {
        const low = String(err || '').toLowerCase()
        return !fields.some((f) => low.includes(`experience ${idx + 1}: ${token(f)}`))
      })
    )
  }

  function clearEducationErrors(idx, fields = []) {
    if (!fields || fields.length === 0) return
    const token = (f) => {
      if (!f) return f
      if (f === 'startDate') return 'start date'
      if (f === 'endDate') return 'end date'
      return f.replace(/([A-Z])/g, ' $1').toLowerCase()
    }
    setValidationErrors((prev) =>
      prev.filter((err) => {
        const low = String(err || '').toLowerCase()
        return !fields.some((f) => low.includes(`education ${idx + 1}: ${token(f)}`))
      })
    )
  }

  function topFieldHasError(key) {
    const low = (key || '').toLowerCase()
    return validationErrors.some((e) => String(e || '').toLowerCase().includes(low))
  }

  function expFieldHasError(idx, field) {
    const needle = `experience ${idx + 1}: ${field}`
    return validationErrors.some((e) => String(e || '').toLowerCase().includes(needle))
  }

  function eduFieldHasError(idx, field) {
    const needle = `education ${idx + 1}: ${field}`
    return validationErrors.some((e) => String(e || '').toLowerCase().includes(needle))
  }

  // ---------- File handler ----------
  async function handleFile(e) {
    const f = e.target.files && e.target.files[0]
    if (!f) return

    setMessage('Parsing...')
    setFileName(f.name)

    try {
      const arrayBuffer = await f.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      const rawHtml = result?.value || ''

      const clean = DOMPurify.sanitize(rawHtml, { ALLOWED_TAGS, ALLOWED_ATTR })

      const tmp = document.createElement('div')
      tmp.innerHTML = clean
      const text = tmp.textContent || tmp.innerText || ''

      const contact = extractContactFromTop(text)

      // block parsing
      const doc = new DOMParser().parseFromString(clean, 'text/html')
      const nodes = Array.from(doc.body.childNodes)

      const blocks = []
      let current = null

      nodes.forEach((n) => {
        const headingText = nodeText(n)
        const isHeading = isHeadingNode(n) || looksLikeHeadingByStyle(n)
        if (isHeading && !looksLikeEntryHeader(headingText)) {
          if (current) blocks.push(current)
          const headingLevel = isHeadingNode(n) ? parseInt(n.tagName.substring(1), 10) : null
          current = { heading: headingText || '', headingLevel, bodyNodes: [] }
        } else {
          if (!current) current = { heading: '', headingLevel: null, bodyNodes: [] }
          current.bodyNodes.push(n.cloneNode(true))
        }
      })
      if (current) blocks.push(current)

      // finalize blocks
      blocks.forEach((b) => {
        const tmp2 = document.createElement('div')
        b.bodyNodes.forEach((n) => tmp2.appendChild(n))
        b.bodyHtml = tmp2.innerHTML
        b.bodyText = tmp2.textContent || ''
        b.bulletCount = (b.bodyHtml.match(/<li[\s>]/gi) || []).length
      })

      const blocksOut = blocks.map((b, i) => {
        const { label, score, confidence } = classifyBlock(b)

        function looksLikeExperienceBlock(bb) {
          const t = bb?.bodyText || ''
          return /\sat\s.+/i.test(t) && (bb.bulletCount || 0) >= 2
        }

        let finalLabel = label
        if (finalLabel === 'EDUCATION' && looksLikeExperienceBlock(b)) finalLabel = 'EXPERIENCE'

        return {
          id: `b${i + 1}`,
          heading: b.heading,
          headingLevel: b.headingLevel,
          bodyHtml: b.bodyHtml,
          bodyText: b.bodyText,
          bulletCount: b.bulletCount,
          label: finalLabel,
          score,
          confidence,
          sectionHeading: b.sectionHeading
        }
      })

      // merge wrapper headings with empty body into next block as sectionHeading
      const merged = []
      for (let i = 0; i < blocksOut.length; i++) {
        const cur = blocksOut[i]
        const next = blocksOut[i + 1]
        if ((!cur.bodyText || !cur.bodyText.trim()) && next) {
          next.sectionHeading = cur.heading || next.sectionHeading || ''
          continue
        }
        merged.push(cur)
      }

      // HEADER synthesis (debug only)
      const sectionLabels = new Set([
        'EXPERIENCE',
        'EDUCATION',
        'SKILLS',
        'PROJECTS',
        'CERTIFICATIONS',
        'AWARDS',
        'PUBLICATIONS',
        'VOLUNTEERING',
        'SUMMARY'
      ])

      function isSectionHeadingText(text) {
        if (!text) return false
        const low = text.toLowerCase()
        return Object.values(headingMap).flat().some((k) => low.includes(k))
      }

      let firstSectionIdx = merged.findIndex((b) => {
        if (!b) return false
        if (sectionLabels.has((b.label || '').toUpperCase())) return true
        if (b.sectionHeading && isSectionHeadingText(b.sectionHeading)) return true
        if (b.heading && isSectionHeadingText(b.heading)) return true
        return false
      })
      if (firstSectionIdx === -1) firstSectionIdx = merged.length

      const finalBlocks = []
      if (firstSectionIdx > 0) {
        const headerParts = merged.slice(0, firstSectionIdx)
        finalBlocks.push({
          id: 'b_header',
          heading: '',
          headingLevel: null,
          bodyHtml: headerParts.map((b) => b.bodyHtml || '').join(''),
          bodyText: headerParts.map((b) => b.bodyText || '').join('\n'),
          label: 'HEADER',
          score: 100,
          confidence: 1
        })
      }
      merged.slice(firstSectionIdx).forEach((b) => finalBlocks.push(b))

      // dedupe
      const seen = new Set()
      const blocksDedup = []
      finalBlocks.forEach((b) => {
        const norm = normalizeSpaces(b.bodyText || '').slice(0, 1200)
        const key = (b.heading || '').trim().toLowerCase() + '::' + norm
        if (!seen.has(key)) {
          seen.add(key)
          blocksDedup.push(b)
        }
      })

      // groups
      const groups = {}
      blocksDedup.forEach((b) => {
        const label = (b.label || 'OTHER').toUpperCase()
        if (!groups[label]) groups[label] = []
        groups[label].push(b.id)
      })

      // entries
      const entries = { EXPERIENCE: [], EDUCATION: [], SKILLS: [] }
      blocksDedup.forEach((b) => {
        const label = (b.label || '').toUpperCase()
        if (label === 'EXPERIENCE') entries.EXPERIENCE.push(...splitExperienceEntries(b))
        if (label === 'EDUCATION') entries.EDUCATION.push(...splitEducationEntries(b))
        if (label === 'SKILLS') {
          entries.SKILLS.push({
            id: `${b.id}_skills1`,
            section: 'SKILLS',
            heading: b.heading,
            bodyText: b.bodyText
          })
        }
      })

      const skeleton = { blocks: blocksDedup, groups, contact, entries }

      // Save debug fields
      setHtml(clean)
      setPlainText(text)
      setResumeJson(skeleton)

      // Populate canonical form
      const form = populateFormFromSkeleton(skeleton, contact)

      // IMPORTANT: normalize before putting into state
      const normalized = normalizeResumeForm({
        ...resumeForm,
        email: form.email || resumeForm.email,
        phone: form.phone || resumeForm.phone,
        summary: form.summary || resumeForm.summary,
        experiences: form.experiences?.length ? form.experiences : resumeForm.experiences,
        education: form.education?.length ? form.education : resumeForm.education,
        skills: form.skills || resumeForm.skills
      })

      setResumeForm(normalized)
      setMessage(`Parsed locally — experiences ${normalized.experiences?.length || 0}, education ${normalized.education?.length || 0}`)
    } catch (err) {
      console.error('Failed to parse docx', err)
      setMessage('Failed to parse file')
    }
  }

  // Save version
  async function handleSave() {
    // normalize first, then validate normalized
    const normalized = normalizeResumeForm(resumeForm)
    const errors = validateResumeForm(normalized)
    if (errors && errors.length) {
      setValidationErrors(errors)
      setMessage('Please fix: ' + errors.slice(0, 5).join('; '))
      return
    }

    // push normalized into state (so UI matches what you saved)
    setResumeForm(normalized)

    const now = new Date().toISOString()

    const baseVersion = {
      userId: (user && user.id) || null,
      sourceType: fileName ? 'docx_import' : 'form',
      fileName: fileName || null,
      resumeForm: normalized,
      importMeta: fileName
        ? {
            html: html || null,
            plainText: plainText || null,
            resumeJson: resumeJson || null,
            parser: 'mammoth',
            parserVersion: (mammoth && mammoth.version) || 'unknown'
          }
        : null,
      meta: {
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
        parser: 'mammoth',
        parserVersion: (mammoth && mammoth.version) || 'unknown',
        normalizationVersion: 1
      },
      createdAt: now
    }

    setMessage('Saving...')
    try {
      // If we have an existing resume, create a new version for it
      if (currentResume && currentResume.resumeId) {
        const payload = { ...baseVersion, resumeId: currentResume.resumeId }
        const res = await fetch('/api/resume/version', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('Server error')
        await res.json()
        setValidationErrors([])
        setMessage('Saved new version to backend')
        // show viewer after saving a new version
        setIsEditing(false)
      } else {
        // No resume exists yet: create a new resume with initialVersion
        const initialVersion = { ...baseVersion }

        const createPayload = {
          userId: (user && user.id) || null,
          title: 'Default Resume',
          makeActive: true,
          initialVersion
        }

        const res = await fetch('/api/resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createPayload)
        })
        if (!res.ok) throw new Error('Server error')
        const data = await res.json()
        // set the newly created resume into state so future saves post versions
        setCurrentResume(data || null)

        // Then immediately create a version for the created resume to ensure both exist
        try {
          const resumeId = data && data.resumeId ? data.resumeId : (data && data.resume && data.resume.resumeId) || null
            if (resumeId) {
            const versionPayload = { ...baseVersion, resumeId }
            const vres = await fetch('/api/resume/version', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(versionPayload)
            })
            if (!vres.ok) throw new Error('Server error creating version')
            await vres.json()
          }
        } catch (e) {
          console.error('Failed to create initial version after resume creation', e)
        }
        setValidationErrors([])
        setMessage('Created resume and initial version')
        // after creating resume+version, show viewer
        setIsEditing(false)
      }
    } catch (err) {
      console.error('Failed to save resume to backend', err)
      setMessage('Failed to save to backend')
    }
  }

  // When not editing, show the viewer which will supply resume data via onEdit
  if (!isEditing) {
    function normalizePayload(p) {
      if (!p) return null
      if (p.resumeForm) return { resumeId: p.resumeId || p.id || null, resumeForm: p.resumeForm }
      if (p.resume && p.resume.resumeForm) return { resumeId: p.resume.resumeId || p.resumeId || null, resumeForm: p.resume.resumeForm }
      if (p.currentVersion && p.currentVersion.resumeForm) return { resumeId: p.resumeId || p.id || null, resumeForm: p.currentVersion.resumeForm }
      if (p.data && p.data.resumeForm) return { resumeId: p.data.resumeId || null, resumeForm: p.data.resumeForm }
      // if looks like resumeForm directly
      const looksLikeForm = p.name || p.email || Array.isArray(p.experiences) || Array.isArray(p.education) || Array.isArray(p.skills)
      if (looksLikeForm) return { resumeId: p.resumeId || p.id || null, resumeForm: p }
      return null
    }

    return (
      <ResumeViewer
        user={user}
        onEdit={(data) => {
          const canonical = normalizePayload(data)
          if (canonical && canonical.resumeForm) {
            const normalized = normalizeResumeForm(canonical.resumeForm)
            setResumeForm((s) => ({ ...s, ...normalized }))
          }
          setCurrentResume(canonical || null)
          setIsEditing(true)
        }}
      />
    )
  }

  return (
    <ResumeForm
      resumeForm={resumeForm}
      skillsText={skillsText}
      message={message}
      fileName={fileName}
      handleFile={handleFile}
      handleSave={handleSave}
      onCancel={() => {
        // revert form to currentResume if present, then show viewer
        if (currentResume && currentResume.resumeForm) {
          const normalized = normalizeResumeForm(currentResume.resumeForm)
          setResumeForm((s) => ({ ...s, ...normalized }))
        }
        setIsEditing(false)
      }}
      saveLabel={currentResume && currentResume.resumeId ? 'Save' : 'Create'}
      updateTopField={updateTopField}
      updateExperience={updateExperience}
      addExperience={addExperience}
      removeExperience={removeExperience}
      updateEducation={updateEducation}
      addEducation={addEducation}
      removeEducation={removeEducation}
      updateSkillsText={updateSkillsText}
      topFieldHasError={topFieldHasError}
      expFieldHasError={expFieldHasError}
      eduFieldHasError={eduFieldHasError}
    />
  )
}
