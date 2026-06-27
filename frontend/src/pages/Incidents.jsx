import { useState, useEffect } from "react"

function severityBadge(sev) {
  const map = { critical: "badge-red", high: "badge-red", medium: "badge-yellow", low: "badge-gray" }
  return <span className={`badge ${map[sev] || "badge-gray"}`}>{sev}</span>
}

function statusBadge(status) {
  const map = { open: "badge-red", in_progress: "badge-yellow", resolved: "badge-green" }
  const label = { open: "Open", in_progress: "In Progress", resolved: "Resolved" }
  return <span className={`badge ${map[status] || "badge-gray"}`}>{label[status] || status}</span>
}

function timeAgo(dateStr) {
  if (!dateStr) return "—"
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)  return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  return `${Math.floor(diff/3600)}h ago`
}

export default function Incidents({ token }) {
  const [title,       setTitle]       = useState("")
  const [description, setDescription] = useState("")
  const [severity,    setSeverity]    = useState("low")
  const [status,      setStatus]      = useState("open")
  const [incidents,   setIncidents]   = useState([])
  const [search,      setSearch]      = useState("")
  const [filter,      setFilter]      = useState("all")
  const [loading,     setLoading]     = useState(true)
  const [submitting,  setSubmitting]  = useState(false)

  const headers = { Authorization: `Bearer ${token}` }

  async function fetchIncidents() {
    const res = await fetch("/api/incidents", { headers })
    const data = await res.json()
    setIncidents(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchIncidents() }, [])

  async function handleSubmit() {
    if (!title) return
    setSubmitting(true)
    await fetch("/api/incidents", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, severity, status }),
    })
    setTitle(""); setDescription("")
    await fetchIncidents()
    setSubmitting(false)
  }

  async function handleStatusUpdate(id, newStatus) {
    await fetch(`/api/incidents/${id}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchIncidents()
  }

  const filtered = incidents.filter(i => {
    const matchSearch = i.title?.toLowerCase().includes(search.toLowerCase()) ||
                        i.description?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "all" || i.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Incidents</h1>
        <p className="page-subtitle">Track and resolve service incidents.</p>
      </div>

      <div className="card section-gap">
        <div className="card-title">Log an incident</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" placeholder="API gateway timeout" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" placeholder="What happened?" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Severity</label>
            <select className="form-select" value={severity} onChange={e => setSeverity(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !title}>
          {submitting ? "Logging…" : "Log incident"}
        </button>
      </div>

      <div className="card">
        <div className="flex-between" style={{marginBottom:"16px"}}>
          <div className="card-title" style={{margin:0}}>All incidents</div>
          <div className="toolbar" style={{margin:0}}>
            <input className="search-input" placeholder="Search incidents…" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="form-select" style={{minWidth:"130px"}} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-text" style={{marginBottom:"8px"}} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{padding:"30px"}}>
            <div className="empty-icon">⚑</div>
            <div className="empty-title">{search ? "No matching incidents" : "No incidents yet"}</div>
            <div className="empty-desc">{search ? "Try a different search." : "Log one above when something breaks."}</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Title</th><th>Description</th><th>Severity</th><th>Status</th><th>Opened</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(incident => (
                  <tr key={incident.id}>
                    <td style={{fontWeight:500}}>{incident.title}</td>
                    <td style={{color:"var(--text-secondary)",fontSize:"13px"}}>{incident.description || "—"}</td>
                    <td>{severityBadge(incident.severity)}</td>
                    <td>{statusBadge(incident.status)}</td>
                    <td className="ts">{timeAgo(incident.created_at)}</td>
                    <td>
                      {incident.status !== "resolved"
                        ? <button className="btn btn-ghost btn-sm" onClick={() => handleStatusUpdate(incident.id, "resolved")}>Resolve</button>
                        : <button className="btn btn-ghost btn-sm" onClick={() => handleStatusUpdate(incident.id, "open")}>Reopen</button>
                      }
                    </td>
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