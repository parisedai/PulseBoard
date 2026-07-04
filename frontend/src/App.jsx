import { useState, useEffect, useRef } from "react"

function App() {
  const [company, setCompany] = useState("")
  const [status, setStatus] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const ws = useRef(null)

  const search = () => {
    if (!company) return
    setLoading(true)
    setResult(null)
    setStatus("Connecting...")

    ws.current = new WebSocket(`ws://localhost:8000/ws/${company}`)

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.status === "complete") {
        setResult(data)
        setLoading(false)
      } else {
        setStatus(data.message)
      }
    }

    ws.current.onerror = () => {
      setStatus("Error connecting to server")
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1>PulseBoard</h1>
      <p>Real-time company intelligence for interview prep</p>
      
      <div style={{ display: "flex", gap: "1rem", margin: "2rem 0" }}>
        <input
          type="text"
          placeholder="Enter company name (e.g. google)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          style={{ flex: 1, padding: "0.5rem" }}
        />
        <button onClick={search} disabled={loading}>
          {loading ? "Analyzing..." : "Search"}
        </button>
      </div>

      {status && <p style={{ color: "gray" }}>{status}</p>}

      {result && (
        <div style={{ marginTop: "2rem" }}>
          <h2>{result.company}</h2>
          <p><strong>Sentiment:</strong> {result.sentiment}</p>
          <p><strong>Summary:</strong> {result.summary}</p>
        </div>
      )}
    </div>
  )
}

export default App