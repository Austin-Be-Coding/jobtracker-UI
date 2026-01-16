import React, { useState } from 'react'
import '../styles/main.css'

export default function ProfilePage({ user } = {}) {
  const [tab, setTab] = useState('resume')
  const firstName = user?.firstName || user?.name || ''
  const avatar = user?.profilePictureURL || ''

  return (
    <div style={{ minHeight: '100vh', width: '100vh', display: 'flex', flexDirection: 'column', padding: 24, boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center', flex: '1 1 auto', justifyContent: 'flex-start' }}>
          {['resume','dream','search','applications'].map((t) => {
            const label = t === 'resume' ? 'Resume' : t === 'dream' ? 'Dream Job' : t === 'search' ? 'Job Search' : 'Applications'
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '0 0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{firstName}</div>
            <div style={{ fontSize: 13, color: '#666' }}>{user?.userName || ''}</div>
          </div>
          <div className="avatar-upload" style={{ width: 72, height: 72, borderRadius: 9999, backgroundImage: avatar ? `url(${avatar})` : 'none' }}>
            {!avatar && <span style={{ fontSize: 26, color: '#666' }}>{firstName ? firstName[0].toUpperCase() : '?'}</span>}
          </div>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 980 }}>
          {tab === 'resume' && (
            <section>
              <h2 className="gradient-heading">Your Resume</h2>
              <p style={{ color: '#444' }}>Upload or edit your resume here.</p>
            </section>
          )}
          {tab === 'dream' && (
            <section>
              <h2 className="gradient-heading">Dream Job</h2>
              <p style={{ color: '#444' }}>Describe your ideal role and companies.</p>
            </section>
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
      </main>
    </div>
  )
}
