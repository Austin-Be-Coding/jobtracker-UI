import React, { useState } from 'react'
import * as userService from './userService'
import '../styles/main.css'

export default function Signin({ onSignedIn } = {}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await userService.login({ username, password })

      // Try to obtain the user object. Prefer response payload, otherwise fetch current user
      let user = data?.user ?? data
      if (!user || !user.id) {
        try {
          const current = await userService.getCurrentUser()
          user = current
        } catch (e) {
          // ignore; we'll surface error below if there's no user
        }
      }

      // Do NOT write auth tokens or sensitive cookies from the client.
      // Rely on server-set httpOnly cookies for auth. If backend returned a token
      // for some reason, keep it in memory via userService.setAuthToken (module var).
      if (data?.token) userService.setAuthToken(data.token)

      if (user && user.id) {
        if (typeof onSignedIn === 'function') onSignedIn(user)
      } else {
        throw new Error('Sign in succeeded but no user information returned')
      }
    } catch (err) {
      setError(err?.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto', padding: 16 }}>
      <h2 className="gradient-heading" style={{ fontSize: 24 }}>Sign in</h2>

      {error && <div className="error" style={{ marginBottom: 8 }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
        <input className="input-field" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="input-field" placeholder="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} style={{ flex: 1 }} />
          <button type="button" className="btn btn-secondary" onClick={() => setShowPassword(s => !s)} aria-label="Toggle password visibility">{showPassword ? '🙈' : '👁️'}</button>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
          <button type="submit" className="cta-button" disabled={loading}>{loading ? 'Signing...' : 'Sign in'}</button>
        </div>
      </form>

    </div>
  )
}
