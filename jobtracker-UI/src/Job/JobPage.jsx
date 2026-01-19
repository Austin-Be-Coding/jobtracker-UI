import React, { useEffect, useState } from 'react'
import jobService from './JobService'

function JobCard({ job }) {
  return (
    <div className="job-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{job.title}</div>
          <div style={{ color: '#666', marginTop: 6 }}>{job.company} • {job.location}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700 }}>{job.type || ''}</div>
          <div style={{ color: '#666' }}>{job.postedAt ? new Date(job.postedAt).toLocaleDateString() : ''}</div>
        </div>
      </div>

      <div style={{ marginTop: 12, color: '#ddd' }}>{job.summary || job.description?.slice(0, 240) || ''}</div>
    </div>
  )
}

export default function JobPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await jobService.getJobs()
        if (!cancelled) setJobs(Array.isArray(data) ? data : (data.jobs || []))
      } catch (err) {
        if (!cancelled) setError(err.message || String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) return <div>Loading jobs…</div>
  if (error) return <div style={{ color: 'salmon' }}>Error: {error}</div>

  return (
    <section>
      <h2 className="gradient-heading">Jobs</h2>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {jobs.length === 0 && <div style={{ color: '#888' }}>No jobs found.</div>}
        {jobs.map((j) => <JobCard key={j.id || j.jobId || j.title} job={j} />)}
      </div>
    </section>
  )
}
