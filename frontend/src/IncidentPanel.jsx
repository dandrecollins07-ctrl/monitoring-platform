import { useState, useEffect } from "react";

export default function IncidentPanel() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [severity, setSeverity] = useState("low");
    const [status, setStatus] = useState("open");
    const [incidents, setIncidents] = useState([]);


useEffect(() => {
    async function fetchData() {
        const res = await fetch("http://localhost:8000/incidents");
        const data= await res.json();

        setIncidents(data);
    }
    fetchData();
}, []);

async function handleSubmit() {
    await fetch("http://localhost:8000/incidents", {
        method: "POST",
        headers:{ "Content-Type": "application/json" },
        body: JSON.stringify({title, description, severity, status}),
    });

    const refreshed = await fetch("http://localhost:8000/incidents");
    const data = await refreshed.json();
    setIncidents(data);
}

async function handleStatusUpdate(id, newStatus) {
    await fetch(`http://localhost:8000/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
    });

    const refreshed = await fetch("http://localhost:8000/incidents");
    const data = await refreshed.json();
    setIncidents(data);
}

return (
    <div>
        <h1> InfraBeacon </h1>

        <h2> IncidentPanel</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} />


        <select name="severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
        </select>

        <select name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="open">Open</option>
            <option value="in_progress"> In Progress</option>
            <option value="resolved"> Resolved</option>
        </select>

        <button onClick={handleSubmit}>Submit</button>


        <h3>Open Incidents</h3>

        {incidents
            .filter(
                (incident) =>
                incident.status === "open" ||
                incident.status === "in_progress"
            )
            .map((incident) => (
                <p key={incident.id}>
                    {incident.title}
                    {incident.description}
                    {incident.severity}

                <button
                    onClick={() =>
                        handleStatusUpdate(incident.id, "resolved")
                    }
                >
                    Resolve
                </button>
            </p>
        ))}

        <h3>Resolved Incidents</h3>

        {incidents
            .filter((incident) => incident.status === "resolved")
            .map((incident) => (
                <p key={incident.id}>
                    {incident.title}
                    {incident.description}
                    {incident.severity}

                    <button
                        onClick={() =>
                            handleStatusUpdate(incident.id, "open")
                        }
                    >
                        Reopen
                    </button>
                </p>
            ))}
    </div>
)
}
