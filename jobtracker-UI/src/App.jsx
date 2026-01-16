import React, { useEffect, useState } from 'react'
import './App.css'
import HomePage from './HomePage/HomePage.jsx'
import CreateUser from './User/CreateUser'
import Signin from './User/Signin'
import ProfilePage from './User/ProfilePage'

function App() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [hash, setHash] = useState(typeof window !== 'undefined' ? window.location.hash : '')

  useEffect(() => {
    let cancelled = false
    async function fetchCurrentUser() {
      try {
        const res = await fetch('/api/user', { credentials: 'include' })
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json()
            setUser(data)
          } else {
            setUser(null)
          }
        }
      } catch (e) {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchCurrentUser()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function onHash() {
      setHash(window.location.hash)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (loading) return <div className="App">Loading…</div>

  return (
    <div className="App">
      {user ? (
        <ProfilePage user={user} />
      ) : hash === '#create' ? (
        <CreateUser onUserCreated={(u) => setUser(u)} />
      ) : hash === '#signin' ? (
        <Signin onSignedIn={(u) => {
          if (u && u.id) {
            setUser(u)
            window.location.hash = '#profile'
          } else {
            (async () => {
              try {
                const res = await fetch('/api/user', { credentials: 'include' })
                if (res.ok) {
                  const data = await res.json()
                  setUser(data)
                  window.location.hash = '#profile'
                }
              } catch (_) {}
            })()
          }
        }} />
      ) : (
        <HomePage onUserCreated={(u) => setUser(u)} />
      )}
    </div>
  )
}

export default App
