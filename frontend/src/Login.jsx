import { useState } from "react"

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  async function handleSubmit() {
    if (!username || !password) { setError("Please enter your username and password."); return }
    setLoading(true); setError("")
    try {
      const form = new FormData()
      form.append("username", username)
      form.append("password", password)
      const res = await fetch("/api/login", { method: "POST", body: form })
      if (!res.ok) { setError("Invalid username or password."); return }
      const data = await res.json()
      onLogin(data.access_token, false)
    } catch {
      setError("Could not reach the server. Try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleDemo() {
    setLoading(true); setError("")
    try {
      const form = new FormData()
      form.append("username", "demo")
      form.append("password", "demo123")
      const res = await fetch("/api/login", { method: "POST", body: form })
      if (!res.ok) { setError("Demo account unavailable right now."); return }
      const data = await res.json()
      onLogin(data.access_token, true)
    } catch {
      setError("Could not reach the server.")
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) { if (e.key === "Enter") handleSubmit() }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-brand">
          <span className="login-brand-icon">◈</span>
          <div className="login-brand-name">Vigil</div>
          <div className="login-brand-sub">Infrastructure monitoring, simplified.</div>
        </div>

        <div className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              placeholder="your-username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={handleKey}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>

          <button className="btn btn-primary" style={{width:"100%", justifyContent:"center"}} onClick={handleSubmit} disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="login-divider">or</div>

          <button className="btn-demo" onClick={handleDemo} disabled={loading}>
            Continue as Guest (Demo mode)
          </button>
        </div>
      </div>
    </div>
  )
}