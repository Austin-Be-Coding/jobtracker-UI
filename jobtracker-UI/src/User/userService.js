// Lightweight REST helpers for /api/users
let API_BASE = 'http://localhost:8080'
let authToken = null
// Default static basic auth credentials for now

let basicAuth = (() => {
  try {
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return `Basic ${window.btoa(`${DEFAULT_BASIC_USER}:${DEFAULT_BASIC_PASS}`)}`
    }
    if (typeof Buffer !== 'undefined') {
      return `Basic ${Buffer.from(`${DEFAULT_BASIC_USER}:${DEFAULT_BASIC_PASS}`).toString('base64')}`
    }
  } catch (e) {
    // fallback to null if encoding not available
  }
  return null
})();

export function setApiBase(url) {
  API_BASE = url.replace(/\/$/, '')
}

export function setAuthToken(token) {
  authToken = token
}

export function clearAuthToken() {
  authToken = null
}

export function getAuthToken() {
  return authToken
}

export function setBasicAuth(user, pass) {
  // compute base64 safely in browser or Node
  // no default auth — explicitly call `setBasicAuth` or `setAuthToken` to enable
  let basicAuth = null
    return text;
  }


function buildOptions(method = 'GET', body = null, opts = {}) {
  const headers = opts.headers || {}
  if (body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`
    else if (basicAuth) headers['Authorization'] = basicAuth

  const options = {
    method,
    headers,
    ...opts,
  }

  if (body) options.body = typeof body === 'string' ? body : JSON.stringify(body)

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

export async function getUsers() {
  const res = await fetch(`${API_BASE}/users`, buildOptions('GET', null))
  if (!res.ok) throw new Error('Failed to fetch users')
  return handleResponse(res)
}

export async function getUser(id) {
  const res = await fetch(`${API_BASE}/users/${id}`, buildOptions('GET', null))
  if (!res.ok) throw new Error('Failed to fetch user')
  return handleResponse(res)
}

export async function createUser(data) {
    console.log('Creating user with data:', data);
  const res = await fetch(`${API_BASE}/users`, buildOptions('POST', data))
  if (!res.ok) throw new Error('Failed to create user')
  return handleResponse(res)
}

export async function updateUser(id, data) {
  const res = await fetch(`${API_BASE}/users/${id}`, buildOptions('PUT', data))
  if (!res.ok) throw new Error('Failed to update user')
  return handleResponse(res)
}

export async function deleteUser(id) {
  const res = await fetch(`${API_BASE}/users/${id}`, buildOptions('DELETE', null))
  if (!res.ok) throw new Error('Failed to delete user')
  return handleResponse(res)
}

// Optional auth helpers — adapt to your backend (token or session)
export async function login(credentials) {
  // credentials: { username, password } or whatever your API expects
  // include credentials so server-set cookies (httpOnly) are handled
  const res = await fetch(`${API_BASE}/auth/login`, buildOptions('POST', credentials, { credentials: 'include' }))
  if (!res.ok) throw new Error('Login failed')
  const data = await handleResponse(res)
  // if backend returns a token, store it
  if (data && data.token) setAuthToken(data.token)
  return data
}


export async function getCurrentUser() {
  // fetch the user associated with current session/cookie
  const res = await fetch(`${API_BASE}/user`, buildOptions('GET', null, { credentials: 'include' }))
  if (!res.ok) throw new Error('Failed to fetch current user')
  return handleResponse(res)
}

export async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, buildOptions('POST', null))
  } finally {
    clearAuthToken()
  }
}

export default {
  setApiBase,
  setAuthToken,
  clearAuthToken,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  login,
  logout,
}

