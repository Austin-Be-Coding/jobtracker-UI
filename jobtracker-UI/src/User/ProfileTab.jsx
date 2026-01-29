import React, { useEffect, useState } from 'react'
import userService from './userService'

export default function ProfileTab({ user, onUserUpdated, onNavigate } = {}) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', userName: '', profilePictureURL: '', location: '', currentJobTitle: '', currentSalary: '', desiredSalary: '', idealLocations: '', skills: '' })
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showCurrentSalary, setShowCurrentSalary] = useState(false)
  const [showDesiredSalary, setShowDesiredSalary] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        userName: user.userName || '',
        profilePictureURL: user.profilePictureURL || '',
        location: user.location || '',
        currentJobTitle: user.currentJobTitle || user.current_title || '',
        currentSalary: user.currentSalary || user.current_salary || '',
        desiredSalary: user.desiredSalary || user.desired_salary || '',
        idealLocations: user.idealLocations || user.ideal_locations || '',
        skills: Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || ''),
      })
    }
  }, [user])

  function updateField(key, value) {
    setForm((s) => ({ ...s, [key]: value }))
  }

  function handleFile(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      updateField('profilePictureURL', dataUrl)
    }
    reader.readAsDataURL(file)
  }

  async function handleSave(e) {
    e && e.preventDefault()
    if (!user || !user.id) return
    setSaving(true)
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        userName: form.userName,
        profilePictureURL: form.profilePictureURL,
        location: form.location,
        currentJobTitle: form.currentJobTitle,
        currentSalary: form.currentSalary,
        desiredSalary: form.desiredSalary,
        idealLocations: form.idealLocations,
        skills: form.skills && typeof form.skills === 'string' ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : form.skills,
      }
      const updated = await userService.updateUser(user.id, payload)
      const result = updated && updated.user ? updated.user : updated
      const finalUser = result || payload
      if (onUserUpdated) onUserUpdated(finalUser)
      // update local form to reflect server-side values
      setForm({
        firstName: finalUser.firstName || '',
        lastName: finalUser.lastName || '',
        email: finalUser.email || '',
        userName: finalUser.userName || '',
        profilePictureURL: finalUser.profilePictureURL || '',
        location: finalUser.location || '',
        currentJobTitle: finalUser.currentJobTitle || finalUser.current_title || '',
        currentSalary: finalUser.currentSalary || finalUser.current_salary || '',
        desiredSalary: finalUser.desiredSalary || finalUser.desired_salary || '',
        idealLocations: finalUser.idealLocations || finalUser.ideal_locations || '',
        skills: Array.isArray(finalUser.skills) ? finalUser.skills.join(', ') : (finalUser.skills || ''),
      })
      setEditing(false)
    } catch (err) {
      console.error('Failed to save profile', err)
      alert('Failed to save profile: ' + (err.message || err))
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      userName: user?.userName || '',
      profilePictureURL: user?.profilePictureURL || '',
      location: user?.location || '',
      currentJobTitle: user?.currentJobTitle || user?.current_title || '',
      currentSalary: user?.currentSalary || user?.current_salary || '',
      desiredSalary: user?.desiredSalary || user?.desired_salary || '',
      idealLocations: user?.idealLocations || user?.ideal_locations || '',
      skills: Array.isArray(user?.skills) ? user.skills.join(', ') : (user?.skills || ''),
    })
    setEditing(false)
  }

  return (
    <section className="profile-section">
      {!editing ? (
        <div className="resume-like-panel">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #eeeeeec4' }}>
                <h2 style={{ margin: 0 }}>{(form.firstName || '') + (form.lastName ? ' ' + form.lastName : '')}</h2>
              </div>
              <div style={{ color: '#666', marginTop: 6 }}>{form.currentJobTitle}{form.location ? ` • ${form.location}` : ''}</div>
            </div>
            
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Email</div>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{form.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Username</div>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{form.userName}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Location</div>
                <div style={{ fontWeight: 500 }}>{form.location}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Current job</div>
                <div style={{ fontWeight: 500 }}>{form.currentJobTitle}</div>
              </div>
            </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Current salary
                  </div>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{showCurrentSalary ? (form.currentSalary || '—') : (form.currentSalary ? '•••••' : '—')}</span>
                    <button type="button" aria-label={showCurrentSalary ? 'Hide current salary' : 'Show current salary'} className="eye-btn" onClick={() => setShowCurrentSalary(s => !s)}>
                      {showCurrentSalary ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.94 17.94A10.97 10.97 0 0019.5 12 11 11 0 005.47 7.46" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 12s4-7 9.5-7 9.5 7 9.5 7-4 7-9.5 7S2.5 12 2.5 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2"/></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Desired salary
                  </div>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{showDesiredSalary ? (form.desiredSalary || '—') : (form.desiredSalary ? '•••••' : '—')}</span>
                    <button type="button" aria-label={showDesiredSalary ? 'Hide desired salary' : 'Show desired salary'} className="eye-btn" onClick={() => setShowDesiredSalary(s => !s)}>
                      {showDesiredSalary ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.94 17.94A10.97 10.97 0 0019.5 12 11 11 0 005.47 7.46" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 12s4-7 9.5-7 9.5 7 9.5 7-4 7-9.5 7S2.5 12 2.5 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2"/></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Skills</div>
                <div style={{ fontWeight: 500 }}>{form.skills}</div>
              </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => setEditing(true)} className="cta-button">Edit</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="resume-like-panel">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div className="avatar-large" style={{ backgroundImage: form.profilePictureURL ? `url(${form.profilePictureURL})` : 'none' }}>
                {!form.profilePictureURL && <span style={{ color: '#888' }}>{(form.firstName || 'U')[0]}</span>}
              </div>
              <label className="choose-file-btn small">
                Upload
                <input id="profile-photo-input" type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ display: 'grid', gap: 8, flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input className="input-field" placeholder="First name" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
                <input className="input-field" placeholder="Last name" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
              </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input className="input-field" placeholder="Username" value={form.userName} onChange={(e) => updateField('userName', e.target.value)} />
              <input className="input-field" placeholder="Email" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
            </div>

            <input className="input-field" placeholder="Location" value={form.location} onChange={(e) => updateField('location', e.target.value)} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input className="input-field" placeholder="Current job title" value={form.currentJobTitle} onChange={(e) => updateField('currentJobTitle', e.target.value)} />
              <input className="input-field" placeholder="Current salary" value={form.currentSalary} onChange={(e) => updateField('currentSalary', e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input className="input-field" placeholder="Desired salary" value={form.desiredSalary} onChange={(e) => updateField('desiredSalary', e.target.value)} />
              <input className="input-field" placeholder="Ideal locations (comma-separated)" value={form.idealLocations} onChange={(e) => updateField('idealLocations', e.target.value)} />
            </div>

            <textarea className="input-field auto-textarea" placeholder="Skills (comma-separated)" value={form.skills} onChange={(e) => updateField('skills', e.target.value)} rows={4} />
          </div>
        </div>
      </div>

          <div className="profile-actions" style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button type="submit" disabled={saving} className="cta-button">{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={handleCancel} className="btn">Cancel</button>
            <button type="button" onClick={() => setForm({ firstName: user?.firstName||'', lastName: user?.lastName||'', email: user?.email||'', userName: user?.userName||'', profilePictureURL: user?.profilePictureURL||'' })} className="btn">Reset</button>
          </div>
        </form>
      )}
    </section>
  )
}
