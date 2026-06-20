import { useState, useEffect } from "react";

export default function AdminPanel() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [expected_status, setExpectedStatus] = useState(0);
  const [interval, setInterval] = useState(0);
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("http://localhost:8000/urls");
      const data = await res.json();

      setUrls(data);
    }

    fetchData();
  }, []);

  async function handleSubmit() {
    await fetch("http://localhost:8000/urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, expected_status, interval }),
    });

    const refreshed = await fetch("http://localhost:8000/urls");
    const data = await refreshed.json();
    setUrls(data);
  }

  async function handleDelete(urlToDelete) {
    await fetch(
      `http://localhost:8000/urls?url=${encodeURIComponent(urlToDelete)}`,
      {
        method: "DELETE",
      }
    );

    const refreshed = await fetch("http://localhost:8000/urls");
    const data = await refreshed.json();
    setUrls(data);
  }

  return (
    <div>
      <h1>InfraBeacon</h1>

      <h2>Admin Panel</h2>

      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input value={url} onChange={(e) => setUrl(e.target.value)} />
      <input
        value={expected_status}
        onChange={(e) => setExpectedStatus(e.target.value)}
      />
      <input
        value={interval}
        onChange={(e) => setInterval(e.target.value)}
      />

      <button onClick={handleSubmit}>Submit</button>

      {urls.map((url) => (
        <p key={url.name}>
          {url.name}
          <button onClick={() => handleDelete(url.url)}>
            Remove
          </button>
        </p>
      ))}
    </div>
  );
}