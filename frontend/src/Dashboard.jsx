import { useState, useEffect } from "react"

function timeAgo(dateStr) {
  if (!dateStr) return "—"
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)  return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  return `${Math.floor(diff/3600)}h ago`
}

function statusBadge(code) {
  if (!code) return <span className="badge badge-gray">Unknown</span>
  if (code >= 200 && code < 300) return <span className="badge badge-green">Healthy</span>
  if (code >= 400 && code < 500) return <span className="badge badge-yellow">Degraded</span>
  return <span className="badge badge-red">Down</span>
}

export default function Dashboard({ token }) {
  const [metrics,    setMetrics]    = useState([])
  const [uptimeData, setUptimeData] = useState([])
  const [urls,       setUrls]       = useState([])
  const [incidents,  setIncidents]  = useState([])
  const [alerts,     setAlerts]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    async function load() {
      try {
        const [mRes, iRes, aRes, uRes] = await Promise.all([
          fetch("/api/metrics",   { headers }),
          fetch("/api/incidents", { headers }),
          fetch("/api/alerts",    { headers }),
          fetch("/api/urls",      { headers }),
        ])
        const mData = await mRes.json()
        const iData = await iRes.json()
        const aData = await aRes.json()
        const uData = await uRes.json()

        const uniqueURLs = [...new Set(mData.map(r => r[2]))]
        const uptime = await Promise.all(
          uniqueURLs.map(url =>
            fetch(`/api/uptime?url=${encodeURIComponent(url)}`, { headers }).then(r => r.json())
          )
        )
        setUrls(uniqueURLs)
        setUptimeData(uptime)
        setMetrics(mData)
        setIncidents(Array.isArray(iData) ? iData : [])
        setAlerts(Array.isArray(aData) ? aData : [])
      } catch {
        setError("Failed to load dashboard data. Check your connection.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div>
      <div className="page-header">
        <div className="skeleton skeleton-text" style={{width:"180px",height:"28px"}} />
        <div className="skeleton skeleton-text short" style={{marginTop:"8px"}} />
      </div>
      <div className="stat-grid">
        {[1,2,3,4].map(i => (
          <div key={i} className="stat-card">
            <div className="skeleton skeleton-text short" />
            <div className="skeleton skeleton-text" style={{height:"36px",marginTop:"8px"}} />
          </div>
        ))}
      </div>
    </div>
  )

  if (error) return (
    <div className="empty-state">
      <div className="empty-icon">⚠</div>
      <div className="empty-title">Something went wrong</div>
      <div className="empty-desc">{error}</div>
    </div>
  )

  const avgUptime   = uptimeData.length ? (uptimeData.reduce((a,b) => a + (typeof b === 'number' ? b : 0), 0) / uptimeData.length).toFixed(1) : "—"
  const avgResponse = metrics.length ? (metrics.reduce((a,r) => a + (r[4] || 0), 0) / metrics.length).toFixed(0) : "—"
  const openIncidents = incidents.filter(i => i.status !== "resolved").length
  const lastCheck   = metrics.length ? metrics[metrics.length-1]?.[5] : null

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Live overview of all monitored services</p>
        </div>
        <span className="ts">Last check {timeAgo(lastCheck)}</span>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Avg Uptime</div>
          <div className="stat-value" style={{background:"var(--accent-grad)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>{avgUptime}%</div>
          <div className="stat-sub">across {urls.length} endpoints</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Response</div>
          <div className="stat-value">{avgResponse}<span style={{fontSize:"16px",color:"var(--text-secondary)"}}> ms</span></div>
          <div className="stat-sub">last {metrics.length} checks</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open Incidents</div>
          <div className="stat-value" style={{color: openIncidents > 0 ? "var(--red)" : "var(--green)"}}>{openIncidents}</div>
          <div className="stat-sub">{incidents.length} total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Alerts Fired</div>
          <div className="stat-value">{alerts.length}</div>
          <div className="stat-sub">all time</div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-title">Endpoint Status</div>
        {urls.length === 0 ? (
          <div className="empty-state" style={{padding:"30px"}}>
            <div className="empty-icon">◎</div>
            <div className="empty-title">No endpoints monitored yet</div>
            <div className="empty-desc">Add one in Settings to get started.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Status</th>
                  <th>Uptime (24h)</th>
                  <th>Last checked</th>
                </tr>
              </thead>
              <tbody>
                {urls.map((url, i) => {
                  const recent = [...metrics].reverse().find(r => r[2] === url)
                  return (
                    <tr key={url}>
                      <td className="mono" style={{color:"var(--accent-cyan)"}}>{url}</td>
                      <td>{statusBadge(recent?.[3])}</td>
                      <td>{typeof uptimeData[i] === 'number' ? `${uptimeData[i].toFixed(1)}%` : "—"}</td>
                      <td className="ts">{timeAgo(recent?.[5])}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Recent Alerts</div>
        {alerts.length === 0 ? (
          <div className="empty-state" style={{padding:"30px"}}>
            <div className="empty-icon">◈</div>
            <div className="empty-title">No alerts yet</div>
            <div className="empty-desc">All systems nominal.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>URL</th><th>Message</th><th>Triggered</th></tr>
              </thead>
              <tbody>
                {alerts.slice(-5).reverse().map((a, i) => (
                  <tr key={i}>
                    <td className="mono" style={{color:"var(--accent-cyan)"}}>{a.url}</td>
                    <td>{a.message}</td>
                    <td className="ts">{timeAgo(a.triggered_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <footer className="page-footer">
        <span>Vigil · Built by D'Andre Collins</span>
        <div className="footer-links">
          <a href="https://www.linkedin.com/in/dandrecollins" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="https://github.com/dandrecollins07-ctrl" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </footer>
    </div>
  )
}