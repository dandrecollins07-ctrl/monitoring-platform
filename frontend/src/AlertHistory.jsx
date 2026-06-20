import { useState, useEffect } from "react";

function AlertHistory() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    async function fetchAlerts() {
      const res = await fetch("http://localhost:8000/alerts");
      const data = await res.json();
      setAlerts(data);
    }

    fetchAlerts();
  }, []);

  return (
    <div>
      <h2>Alert History</h2>

      <table border="1">
        <thead>
          <tr>
            <th>URL</th>
            <th>Status Code</th>
            <th>Avg Response (ms)</th>
            <th>Message</th>
            <th>Triggered At</th>
          </tr>
        </thead>

        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id}>
              <td>{alert.url}</td>
              <td>{alert.status_code}</td>
              <td>{alert.avg_response_ms ?? "N/A"}</td>
              <td>{alert.message}</td>
              <td>{alert.triggered_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AlertHistory;