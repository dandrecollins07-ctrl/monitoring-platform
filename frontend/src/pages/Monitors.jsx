import { useState, useEffect } from "react"

export default function Monitors({ token, role }) {
  const [name,            setName]           = useState("")
  const [url,             setUrl]            = useState("")
  const [expectedStatus,  setExpectedStatus] = useState(200)
  const [interval,        setIntervalVal]    = useState(60)
  const [urls,            setUrls]           = useState([])
  const [loading,         setLoading]        = useState(true)
  const [submitting,      setSubmitting]     = useState(false)
  const [error,           setError]          = useState("")
  const [success,         setSuccess]        = useState("")

  const headers = { Authorization: `Bearer ${token}` }

  async function fetchUrls() {
    const res = await fetch("/api/urls", { headers })
    const data = await res.json()
    setUrls(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchUrls() }, [])

  async function handleAdd() {
    if (!name || !url) { setError("Name and URL are required."); return }
    setSubmitting(true); setError(""); setSuccess("")
    try {
      const res = await fetch("/api/urls", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, expected_status: Number(expectedStatus), interval: Number(interval) }),
      })
      if (!res.ok) { setError("Failed to add monitor."); return }
      setName(""); setUrl(""); setExpectedStatus(200); setIntervalVal(60)
      setSuccess("Monitor added successfully.")
      fetchUrls()
    } catch { setError("Request failed.") }
    finally { setSubmitting(false) }
  }

  async function handleDelete(urlToDelete) {
    await fetch(`/api/urls?url=${encodeURIComponent(urlToDelete)}`, { method: "DELETE", headers })
    fetchUrls()
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Monitors</h1>
        <p className="page-subtitle">Manage the endpoints Vigil watches.</p>
      </div>

      {role === "admin" && (
        <div className="card section-gap">
          <div className="card-title">Add a monitor</div>
          {error   && <div className="login-error" style={{marginBottom:"12px"}}>{error}</div>}
          {success && <div style={{background:"rgba(63,185,80,.1)",border:"1px solid rgba(63,185,80,.3)",color:"var(--green)",padding:"10px 14px",borderRadius:"6px",fontSize:"13px",marginBottom:"12px"}}>{success}</div>}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" placeholder="GitHub API" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">URL</label>
              <input className="form-input" placeholder="https://api.github.com" value={url} onChange={e => setUrl(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Expected status</label>
              <input className="form-input" type="number" value={expectedStatus} onChange={e => setExpectedStatus(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Interval (s)</label>
              <input className="form-input" type="number" value={interval} onChange={e => setIntervalVal(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd} disabled={submitting}>
            {submitting ? "Adding…" : "Add monitor"}
          </button>
        </div>
      )}

      <div className="card">
        <div className="card-title">Active monitors</div>
        {loading ? (
          <div>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-text" style={{marginBottom:"8px"}} />)}</div>
        ) : urls.length === 0 ? (
          <div className="empty-state" style={{padding:"30px"}}>
            <div className="empty-icon">◎</div>
            <div className="empty-title">No monitors yet</div>
            <div className="empty-desc">Add one above to start collecting data.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>URL</th><th>Expected</th><th>Interval</th>{role === "admin" && <th></th>}</tr>
              </thead>
              <tbody>
                {urls.map(u => (
                  <tr key={u.url}>
                    <td style={{fontWeight:500}}>{u.name}</td>
                    <td className="mono" style={{color:"var(--accent-cyan)"}}>{u.url}</td>
                    <td><span className="badge badge-green">{u.expected_status ?? 200}</span></td>
                    <td className="ts">{u.interval ?? 60}s</td>
                    {role === "admin" && <td><button className="btn-danger" onClick={() => handleDelete(u.url)}>Remove</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}