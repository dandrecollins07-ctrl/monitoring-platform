import { useState, useEffect } from "react"

export default function App() {
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [uptimeData, setUptimeData] = useState([])
  const [urls, setUrls] = useState([])

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("http://localhost:8000/metrics")
      const data = await res.json()

      const uniqueURLs = [...new Set(data.map(r => r[2]))]

      const uptime = await Promise.all(
        uniqueURLs.map(url =>
          fetch(`http://localhost:8000/uptime?url=${url}`)
            .then(r => r.json())
        )
      )

      setUrls(uniqueURLs)
      setUptimeData(uptime)
      setMetrics(data)
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h1>InfraBeacon</h1>

      <h2>Uptime Summary</h2>
      {urls.map((url, index) => (
        <p key={url}>
          {url} — {uptimeData[index]}%
        </p>
      ))}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>URL</th>
            <th>Status Code</th>
            <th>Response Time</th>
            <th>Checked at</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((record) => (
            <tr key={record[0]}>
              <td>{record[0]}</td>
              <td>{record[1]}</td>
              <td>{record[2]}</td>
              <td>{record[3]}</td>
              <td>{record[4]}</td>
              <td>{record[5]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}