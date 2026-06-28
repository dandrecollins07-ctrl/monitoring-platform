import { useState, useEffect } from "react"

function timeAgo(dateStr) {
  if (!dateStr) return "—"
  const diff = Math.max(0, (Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)  return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  return `${Math.floor(diff/3600)}h ago`
}

function statusBadge(code) {
  if (!code) return <span className="badge badge-gray">—</span>
  if (code >= 200 && code < 300) return <span className="badge badge-green">{code}</span>
  if (code >= 400 && code < 500) return <span className="badge badge-yellow">{code}</span>
  return <span className="badge badge-red">{code}</span>
}

export default function Alerts({ token }) {
  const [alerts,  setAlerts]  = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState("")
  const [error,   setError]   = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/alerts", { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        setAlerts(Array.isArray(data) ? data : [])
      } catch { setError("Failed to load alerts.") }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const filtered = alerts.filter(a =>
    a.url?.toLowerCase().includes(search.toLowerCase()) ||
    a.message?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Alerts</h1>
        <p className="page-subtitle">A full history of every alert Vigil has fired.</p>
      </div>

      <div className="card">
        <div className="flex-between" style={{marginBottom:"16px"}}>
          <div className="card-title" style={{margin:0}}>{alerts.length} alerts total</div>
          <input className="search-input" placeholder="Search by URL or message…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div>{[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-text" style={{marginBottom:"8px"}} />)}</div>
        ) : error ? (
          <div className="empty-state" style={{padding:"30px"}}>
            <div className="empty-icon">⚠</div>
            <div className="empty-title">Could not load alerts</div>
            <div className="empty-desc">{error}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{padding:"30px"}}>
            <div className="empty-icon">◈</div>
            <div className="empty-title">{search ? "No matching alerts" : "No alerts fired yet"}</div>
            <div className="empty-desc">{search ? "Try a different search." : "All systems are operating normally."}</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>URL</th><th>Status</th><th>Avg response</th><th>Message</th><th>Triggered</th></tr>
              </thead>
              <tbody>
                {[...filtered].reverse().map((alert, i) => (
                  <tr key={i}>
                    <td className="mono" style={{color:"var(--accent-cyan)"}}>{alert.url}</td>
                    <td>{statusBadge(alert.status_code)}</td>
                    <td className="mono">{alert.avg_response_ms != null ? `${parseFloat(alert.avg_response_ms).toFixed(2)} ms` : "—"}</td>
                    <td style={{color:"var(--text-secondary)",fontSize:"13px"}}>{alert.message}</td>
                    <td className="ts">{timeAgo(alert.triggered_at)}</td>
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