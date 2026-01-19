import React, { useEffect, useState } from 'react'
import userService from './userService'

export default function ProfileTab({ user, onUserUpdated, onNavigate } = {}) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', userName: '', profilePictureURL: '', location: '', currentJobTitle: '', currentSalary: '', desiredSalary: '', idealLocations: '', skills: '' })
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

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
      if (onUserUpdated) onUserUpdated(result || payload)
      setEditing(false)
      setForm((s) => ({ ...s }))
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
    })
    setEditing(false)
  }

  return (
    <section className="profile-section">
      {!editing ? (
        <div className="profile-info">
          <h2 className='profile-header'>Info</h2>
          <div className="profile-info-row">
            <div className="profile-info-label">First name</div>
            <div className="profile-info-value">{form.firstName}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Location</div>
            <div className="profile-info-value">{form.location}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Last name</div>
            <div className="profile-info-value">{form.lastName}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Current job</div>
            <div className="profile-info-value">{form.currentJobTitle}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Current salary</div>
            <div className="profile-info-value">{form.currentSalary}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Desired salary</div>
            <div className="profile-info-value">{form.desiredSalary}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Ideal locations</div>
            <div className="profile-info-value">{form.idealLocations}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Skills</div>
            <div className="profile-info-value">{form.skills}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Username</div>
            <div className="profile-info-value">{form.userName}</div>
          </div>
          <div className="profile-info-row">
            <div className="profile-info-label">Email</div>
            <div className="profile-info-value">{form.email}</div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={() => setEditing(true)} className="profile-edit-button">Edit info</button>
            <button onClick={() => (onNavigate ? onNavigate('resume') : (window.location.hash = '#resume'))} style={{color: 'white'}} className="btn btn-secondary">Auto-fill with resume</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="profile-form">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="avatar-large" style={{ backgroundImage: form.profilePictureURL ? `url(${form.profilePictureURL})` : 'none' }}>
              {!form.profilePictureURL && <span style={{ color: '#888' }}>{(form.firstName || 'U')[0]}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#333' }}>Upload photo</label>
              <input type="file" accept="image/*" onChange={handleFile} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input className="input-field" placeholder="First name" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
            <input className="input-field" placeholder="Last name" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
          </div>

          <input className="input-field" placeholder="Username" value={form.userName} onChange={(e) => updateField('userName', e.target.value)} />
          <input className="input-field" placeholder="Email" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
            <input className="input-field" placeholder="Location" value={form.location} onChange={(e) => updateField('location', e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input className="input-field" placeholder="Current job title" value={form.currentJobTitle} onChange={(e) => updateField('currentJobTitle', e.target.value)} />
              <input className="input-field" placeholder="Current salary" value={form.currentSalary} onChange={(e) => updateField('currentSalary', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input className="input-field" placeholder="Desired salary" value={form.desiredSalary} onChange={(e) => updateField('desiredSalary', e.target.value)} />
              <input className="input-field" placeholder="Ideal locations (comma-separated)" value={form.idealLocations} onChange={(e) => updateField('idealLocations', e.target.value)} />
            </div>
            <textarea className="input-field" placeholder="Skills (comma-separated)" value={form.skills} onChange={(e) => updateField('skills', e.target.value)} />

          <div className="profile-actions">
            <button type="submit" disabled={saving} className="cta-button">{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={handleCancel} className="btn">Cancel</button>
            <button type="button" onClick={() => setForm({ firstName: user?.firstName||'', lastName: user?.lastName||'', email: user?.email||'', userName: user?.userName||'', profilePictureURL: user?.profilePictureURL||'' })} className="btn">Reset</button>
          </div>
        </form>
      )}
    </section>
  )
}
