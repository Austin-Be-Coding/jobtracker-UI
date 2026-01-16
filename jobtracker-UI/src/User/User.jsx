import React, { useEffect, useState } from 'react'
import * as userService from './userService'

export default function User() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ firstName: '' })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError(null)
    try {
      const data = await userService.getUsers()
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function save(e) {
    e.preventDefault()
    try {
      if (editingId) {
        const updated = await userService.updateUser(editingId, form)
        setUsers(users.map(u => (u.id === editingId ? updated : u)))
        setEditingId(null)
      } else {
        const created = await userService.createUser(form)
        setUsers([...(users || []), created])
      }
      setForm({ firstName: '' })
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this user?')) return
    try {
      await userService.deleteUser(id)
      setUsers(users.filter(u => u.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  function edit(u) {
    setEditingId(u.id)
    setForm({ firstName: u.firstName || '' })
  }

  return (
    <div style={{ maxWidth: 700, margin: '1.5rem auto', padding: 12 }}>
      <h3>Users</h3>
      <div style={{ marginBottom: 12 }}>
        <button onClick={load} style={{ marginRight: 8 }}>Reload</button>
      </div>
      {loading && <div>Loading…</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 6 }}>ID</th>
            <th style={{ textAlign: 'left', padding: 6 }}>First name</th>
            <th style={{ textAlign: 'left', padding: 6 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users && users.map(u => (
            <tr key={u.id}>
              <td style={{ padding: 6 }}>{u.id}</td>
              <td style={{ padding: 6 }}>{u.firstName || u.name || '-'}</td>
              <td style={{ padding: 6 }}>
                <button onClick={() => edit(u)} style={{ marginRight: 8 }}>Edit</button>
                <button onClick={() => remove(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr style={{ margin: '16px 0' }} />

      <form onSubmit={save} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input name="firstName" placeholder="First name" value={form.firstName} onChange={onChange} />
        <button type="submit">{editingId ? 'Update' : 'Create'}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ firstName: '' }) }}>Cancel</button>}
      </form>
    </div>
  )
}
