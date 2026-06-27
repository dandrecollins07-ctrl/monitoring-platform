export default function Landing({ onEnter }) {
  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-name">Vigil</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onEnter}>Sign in</button>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-eyebrow">Infrastructure Monitoring · Incident Tracking · Anomaly Detection</div>
          <h1 className="landing-headline">
            Know when your services fail —<br />
            <span className="landing-headline-accent">before your users do.</span>
          </h1>
          <p className="landing-subtext">
            Vigil pings your endpoints every 60 seconds, parses real server logs,
            detects traffic anomalies, tracks incidents from open to resolved,
            and fires alerts the moment something degrades. Full observability stack,
            self-hosted on AWS.
          </p>
          <div className="landing-cta-row">
            <button className="btn btn-primary" style={{padding:"12px 28px",fontSize:"15px"}} onClick={onEnter}>
              Try the live demo
            </button>
            <a
              href="https://github.com/dandrecollins07-ctrl"
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
              style={{padding:"12px 28px",fontSize:"15px"}}
            >
              View source
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="landing-stats">
        <div className="landing-stat">
          <span className="landing-stat-value">60s</span>
          <span className="landing-stat-label">ping interval</span>
        </div>
        <div className="landing-stat-divider" />
        <div className="landing-stat">
          <span className="landing-stat-value">1.8M</span>
          <span className="landing-stat-label">log lines ingested</span>
        </div>
        <div className="landing-stat-divider" />
        <div className="landing-stat">
          <span className="landing-stat-value">live</span>
          <span className="landing-stat-label">on AWS EC2</span>
        </div>
        <div className="landing-stat-divider" />
        <div className="landing-stat">
          <span className="landing-stat-value">JWT</span>
          <span className="landing-stat-label">auth + RBAC</span>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="landing-features-grid">
          {[
            {
              icon: "◎",
              title: "Endpoint monitoring",
              desc: "Configurable HTTP health checks across any public URL. Response time, status code, and uptime tracked continuously."
            },
            {
              icon: "⬡",
              title: "Log ingestion + anomaly detection",
              desc: "Parses raw server logs into structured records. Flags IP-based anomalies, 404 spikes, and unusual traffic windows automatically."
            },
            {
              icon: "⚑",
              title: "Incident management",
              desc: "Log, triage, and resolve incidents with severity levels and status tracking — from open to in-progress to resolved."
            },
            {
              icon: "◈",
              title: "Real-time alerting",
              desc: "Threshold-based degradation detection fires Discord webhook alerts the moment avg latency or error rates cross your limits."
            },
            {
              icon: "⚙",
              title: "Role-based access control",
              desc: "Admin and viewer roles enforced across every API route. JWT-secured sessions with bcrypt password hashing."
            },
            {
              icon: "▦",
              title: "Deployed on AWS",
              desc: "Containerized with Docker Compose and running on an EC2 instance behind Caddy. Real infrastructure, real uptime data."
            },
          ].map(({ icon, title, desc }) => (
            <div className="landing-feature-card" key={title}>
              <div className="landing-feature-icon">{icon}</div>
              <div className="landing-feature-title">{title}</div>
              <div className="landing-feature-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section className="landing-stack">
        <div className="landing-stack-label">Built with</div>
        <div className="landing-stack-chips">
          {["FastAPI","PostgreSQL","React","Docker","AWS EC2","JWT","Python","Caddy","Discord Webhooks"].map(t => (
            <span key={t} className="stack-chip">{t}</span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <span>Built by <a href="https://www.linkedin.com/in/dandrecollins" target="_blank" rel="noreferrer" style={{color:"var(--accent-cyan)"}}>D'Andre Collins</a> · CS + ITWS @ RPI</span>
        <div className="footer-links">
          <a href="https://www.linkedin.com/in/dandrecollins" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="https://github.com/dandrecollins07-ctrl" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </footer>
    </div>
  )
}