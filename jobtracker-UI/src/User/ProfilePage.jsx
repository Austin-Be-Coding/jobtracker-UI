import React, { useState } from 'react'
import '../styles/main.css'
import ResumePage from './ResumePage'
import ProfileTab from './ProfileTab'

export default function ProfilePage({ user, onUserUpdated } = {}) {
  const [tab, setTab] = useState('profile')
  const firstName = user?.firstName || user?.name || ''
  const avatar = user?.profilePictureURL || ''

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', padding: '24px 0', boxSizing: 'border-box' }}>
      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr 260px', gap: 24, alignItems: 'start', width: '100%' }}>
        <aside style={{ width: 220, display: 'flex', flexDirection: 'column', alignItems: 'stretch', paddingTop: 8 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
            {['profile','resume','dream','search','applications'].map((t) => {
              const labels = { profile: 'Profile', resume: 'Resume', dream: 'Dream Job', search: 'Job Search', applications: 'Applications' }
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

        <div style={{ width: '100%', maxWidth: 980, height: '100%', margin: '0 auto' }}>
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

        <aside style={{ width: 260, padding: 12, borderLeft: '1px solid rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div className="avatar-upload" style={{ width: 96, height: 96, borderRadius: 12, backgroundImage: avatar ? `url(${avatar})` : 'none' }}>
            {!avatar && <span style={{ fontSize: 36, color: '#666' }}>{firstName ? firstName[0].toUpperCase() : '?'}</span>}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{firstName}</div>
            <div style={{ fontSize: 13, color: '#666' }}>{user?.userName || ''}</div>
          </div>
        </aside>
      </main>
    </div>
  )
}
