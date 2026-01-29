import React, { useState, useEffect } from 'react'
import '../styles/main.css'
import ResumePage from '../Resume/ResumePage'
import JobPage from '../Job/JobPage'
import ProfileTab from './ProfileTab'

export default function ProfilePage({ user, onUserUpdated, onLogout } = {}) {
  const [tab, setTab] = useState('profile')
  const [menuOpen, setMenuOpen] = useState(false)
  const firstName = user?.firstName || user?.name || ''
  const avatar = user?.profilePictureURL || ''

  useEffect(() => {
    try {
      const theme = localStorage.getItem('theme')
      if (theme === 'light') document.documentElement.classList.add('light-mode')
      else document.documentElement.classList.remove('light-mode')
    } catch (e) {}
  }, [])

  function toggleTheme() {
    try {
      const isLight = document.documentElement.classList.toggle('light-mode')
      localStorage.setItem('theme', isLight ? 'light' : 'dark')
    } catch (e) {}
  }

  function handleLogout() {
    if (typeof onLogout === 'function') return onLogout()
    console.log('Logout requested')
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', padding: 0, boxSizing: 'border-box' }}>
      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr 260px', gap: 24, alignItems: 'stretch', width: '100%', height: '100%', gridAutoRows: 'minmax(0, 1fr)' }}>
        <aside style={{ width: 220, display: 'flex', flexDirection: 'column', alignItems: 'stretch', paddingTop: 8 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
            {['profile','resume','dream','jobs','applications'].map((t) => {
              const labels = { profile: 'Profile', resume: 'Resume', dream: 'Dream Job', jobs: 'Jobs', applications: 'Applications' }
              const label = labels[t] || t
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    background: tab === t ? 'linear-gradient(90deg,#ffb020,#ff7a00)' : 'transparent',
                    color: tab === t ? '#fff' : '#7a4300',
                    fontWeight: 700
                  }}
                >
                  {label}
                </button>
              )
            })}
          </nav>
        </aside>

        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {tab === 'profile' && (
            <ProfileTab user={user} onUserUpdated={onUserUpdated} onNavigate={(t) => setTab(t)} />
          )}
          {tab === 'resume' && (
            <ResumePage user={user} />
          )}
          {tab === 'dream' && (
            <section>
              <h2 className="gradient-heading">Dream Job</h2>
              <p style={{ color: '#444' }}>Describe your ideal role and companies.</p>
            </section>
          )}
          {tab === 'jobs' && (
            <JobPage />
          )}
          {tab === 'search' && (
            <section>
              <h2 className="gradient-heading">Job Search</h2>
              <p style={{ color: '#444' }}>Track search criteria and saved searches.</p>
            </section>
          )}
          {tab === 'applications' && (
            <section>
              <h2 className="gradient-heading">Applications</h2>
              <p style={{ color: '#444' }}>View applications you've submitted.</p>
            </section>
          )}
        </div>

        <aside style={{ minWidth: 260, padding: 12, borderLeft: '1px solid rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', boxSizing: 'border-box' }}>
          <div className="profile-avatar-wrap">
            <div
              className="avatar-upload"
              role="button"
              tabIndex={0}
              aria-label="Toggle profile menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((s) => !s)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setMenuOpen((s) => !s) }}
              style={{ width: 96, height: 96, borderRadius: 12, backgroundImage: avatar ? `url(${avatar})` : 'none' }}>
              {!avatar && <span style={{ fontSize: 36, color: '#666' }}>{firstName ? firstName[0].toUpperCase() : '?'}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{firstName}</div>
            <div style={{ fontSize: 13, color: '#666' }}>{user?.userName || ''}</div>
          </div>
        </aside>
      </main>

      {/* Overlay for drawer - closes when clicked */}
      <div
        className={"profile-drawer-overlay" + (menuOpen ? ' open' : '')}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      {/* Right-side profile drawer */}
      <aside
        className={"profile-drawer" + (menuOpen ? ' open' : '')}
        role="dialog"
        aria-modal="true"
        aria-hidden={!menuOpen}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 800 }}>{firstName}</div>
          <button className="btn" onClick={() => setMenuOpen(false)} aria-label="Close profile menu">Close</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => { toggleTheme(); }} className="btn">Toggle Light/Dark</button>
          <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="btn" style={{ marginTop: 8 }}>Log out</button>
        </div>
      </aside>

    </div>
  )
}
