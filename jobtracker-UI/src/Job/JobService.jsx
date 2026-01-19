const API_BASE_DEFAULT = 'http://localhost:8080'
let API_BASE = API_BASE_DEFAULT

export function setApiBase(url) {
  API_BASE = (url || '').replace(/\/$/, '') || API_BASE_DEFAULT
}

function buildOptions(method = 'GET', body = null, opts = {}) {
  const headers = opts.headers || {}
  if (body && !(body instanceof FormData) && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  const options = { method, headers, ...opts }
  if (body) options.body = body instanceof FormData ? body : JSON.stringify(body)
  return options
}

async function handleResponse(res) {
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch (e) { data = text }
  if (!res.ok) {
    const message = (data && data.message) ? data.message : res.statusText || 'Request failed'
    throw new Error(message)
  }
  return data
}

export async function getJobs() {
  const res = await fetch(`${API_BASE}/jobs`, buildOptions('GET', null, { credentials: 'include' }))
  return handleResponse(res)
}

export default { setApiBase, getJobs }