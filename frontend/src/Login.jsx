import { useState } from "react"

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit() {
    const form = new FormData()
    form.append("username", username)
    form.append("password", password)

    const res = await fetch("/api/login", {
      method: "POST",
      body: form
    })

    if (!res.ok) {
      setError("Invalid credentials")
      return
    }

    const data = await res.json()
    localStorage.setItem("token", data.access_token)
    onLogin(data.access_token)
  }

  return (
    <div>
      <h1>InfraBeacon Login</h1>
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleSubmit}>Login</button>
      {error && <p>{error}</p>}
    </div>
  )
}