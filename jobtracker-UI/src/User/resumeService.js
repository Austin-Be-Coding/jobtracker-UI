// API client for resume upload and AI analysis
let API_BASE = 'http://localhost:8080'

export function setApiBase(url) {
  API_BASE = url.replace(/\/$/, '')
}

function buildOptions(method = 'GET', body = null, opts = {}) {
  const headers = opts.headers || {}

  // If body is FormData, don't set Content-Type and don't stringify
  const isFormData = (typeof FormData !== 'undefined') && (body instanceof FormData)
  if (body && !isFormData && !headers['Content-Type']) headers['Content-Type'] = 'application/json'

  const options = {
    method,
    headers,
    ...opts,
  }

  if (body) {
    if (isFormData) options.body = body
    else options.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  return options
}

async function handleResponse(res) {
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch (e) {
    data = text
  }
  if (!res.ok) {
    const message = (data && data.message) ? data.message : res.statusText || 'Request failed'
    throw new Error(message)
  }
  return data
}

export async function uploadResume(file, userId) {
  const form = new FormData()
  // backend field name may be 'file' or 'resume' — adjust if needed
  form.append('file', file)
  if (userId !== undefined && userId !== null) {
    // include userId so backend can associate the resume with the user
    form.append('userId', String(userId))
  }

  const res = await fetch(`${API_BASE}/resumes/upload`, buildOptions('POST', form, { credentials: 'include' }))
  return handleResponse(res)
}

export async function analyzeResume(resumeId, promptType) {
  const res = await fetch(
    `${API_BASE}/api/ai/analyze-resume/${encodeURIComponent(resumeId)}`,
    buildOptions('POST', { promptType }, { credentials: 'include' })
  )
  return handleResponse(res)
}

export async function getSuggestions(resumeId) {
  const res = await fetch(`${API_BASE}/api/ai/suggestions/${encodeURIComponent(resumeId)}`, buildOptions('GET', null, { credentials: 'include' }))
  return handleResponse(res)
}

export async function getUserResumes(userId) {
  const url = userId ? `${API_BASE}/resumes/user/${encodeURIComponent(userId)}` : `${API_BASE}/resumes`
  const res = await fetch(url, buildOptions('GET', null, { credentials: 'include' }))
  return handleResponse(res)
}

export default {
  setApiBase,
  uploadResume,
  analyzeResume,
  getSuggestions,
}
