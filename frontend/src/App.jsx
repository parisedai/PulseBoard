import { useState, useEffect, useRef } from "react"

const STATUS_SEQ = [
  "analyzing ···",
  "searching github...",
  "checking hiring signals...",
  "scanning recent news...",
  "synthesizing signals...",
]
const STATUS_DELAYS = [0, 600, 1800, 2900, 4000]

const STREAM = [
  { company: "Airbnb", tag: "hiring ↑", detail: "infrastructure roles", t: "2m" },
  { company: "Stripe", tag: "GitHub ↑", detail: "payments core", t: "4m" },
  { company: "OpenAI", tag: "activity ↑", detail: "research repos", t: "7m" },
  { company: "Figma", tag: "hiring ↑", detail: "ML engineer roles", t: "11m" },
  { company: "Vercel", tag: "GitHub ↑", detail: "edge runtime", t: "14m" },
  { company: "Linear", tag: "GitHub ↑", detail: "core product", t: "19m" },
]

const SAMPLE_PILLS = [
  { g: "◈", label: "Hiring ↑" },
  { g: "⬡", label: "GitHub ↑" },
  { g: "◎", label: "AI infrastructure" },
]

const SENTIMENT = {
  positive: { color: "#2D6A4F", bg: "#EDF4F0", label: "positive signal" },
  negative: { color: "#9B2226", bg: "#F6ECED", label: "negative signal" },
  neutral:  { color: "#8A8074", bg: "#F0EDE8", label: "neutral" },
}

const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #EDEAE4;
    font-family: 'DM Sans', system-ui, sans-serif;
    color: #1A1714;
    min-height: 100vh;
  }

  @keyframes rise {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes pillFade {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse-dot {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.3; }
  }

  @keyframes drawLine {
    from { width: 0; }
    to   { width: 100%; }
  }

  .wordmark {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.12em;
    color: #C4BBB0;
    text-transform: uppercase;
  }

  .topbar-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #C4BBB0;
    background: #EDE9E2;
    padding: 4px 9px;
    border-radius: 999px;
    letter-spacing: 0.04em;
  }

  .signal-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #1A1714;
    background: #F0EDE8;
    border: 1px solid #E8E3DC;
    padding: 4px 10px;
    border-radius: 999px;
    opacity: 0;
    animation: pillFade 0.4s ease forwards;
  }

  .pill-glyph { color: #A0522D; font-size: 10px; }

  .card-divider { height: 1px; background: #F0EDE8; margin: 0.9rem 0; }

  .metrics-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .metric {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #C4BBB0;
    letter-spacing: 0.02em;
  }

  .metric-val { color: #8A8074; }
  .metric-sep { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #D9D4CE; }

  .live-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #A0522D;
    margin-left: 4px;
    animation: pulse-dot 2s ease-in-out infinite;
  }

  .company-logo-sm {
    width: 28px; height: 28px;
    border-radius: 6px;
    object-fit: contain;
    background: #F7F3EC;
    border: 1px solid #EEE9E2;
    padding: 3px;
  }

  .search-inner {
    position: relative;
    display: flex;
    align-items: center;
    background: #F5F2ED;
    border: 1px solid #E8E3DC;
    border-radius: 10px;
    transition: border-color 0.2s, box-shadow 0.2s;
    overflow: hidden;
  }

  .search-inner.focused {
    border-color: #1A1714;
    box-shadow: 0 1px 12px rgba(26,23,20,0.06);
  }

  .search-inner.focused::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    height: 2px;
    background: #A0522D;
    animation: drawLine 0.35s cubic-bezier(0.16,1,0.3,1) forwards;
  }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    padding: 14px 12px 14px 18px;
    font-size: 14px;
    font-family: 'JetBrains Mono', monospace;
    color: #1A1714;
    outline: none;
    letter-spacing: 0.01em;
  }

  .search-input::placeholder { color: #C4BBB0; }

  .search-btn {
    margin: 6px 6px 6px 0;
    background: #1A1714;
    border: none;
    border-radius: 7px;
    color: #F7F3EC;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    padding: 8px 16px;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    white-space: nowrap;
    letter-spacing: 0.04em;
    min-width: 148px;
    text-align: center;
  }

  .search-btn:hover:not(:disabled) { background: #2E2924; transform: translateY(-1px); }
  .search-btn:active:not(:disabled) { transform: translateY(0); }
  .search-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`

const HOME_CSS = `
  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem 1.5rem 0;
  }

  .home-topbar {
    width: 100%;
    max-width: 560px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6rem;
  }

  .hero {
    text-align: center;
    margin-bottom: 2.75rem;
    max-width: 600px;
  }

  .hero-line1 {
    display: block;
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: clamp(2.4rem, 5.5vw, 3.4rem);
    color: #1A1714;
    letter-spacing: -0.02em;
    line-height: 1.08;
    animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) both;
  }

  .hero-line2 {
    display: block;
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-style: italic;
    font-size: clamp(2.4rem, 5.5vw, 3.4rem);
    color: #4A3F35;
    letter-spacing: -0.01em;
    line-height: 1.08;
    animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both;
  }

  .hero-sub {
    margin-top: 1.2rem;
    font-size: 14px;
    font-weight: 400;
    color: #8A8074;
    line-height: 1.7;
    animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both;
  }

  .home-search-wrap {
    width: 100%;
    max-width: 520px;
    margin-bottom: 2.5rem;
    animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) 0.28s both;
  }

  .sample-card {
    width: 100%;
    max-width: 520px;
    background: #F5F2ED;
    border: 1px solid #E8E3DC;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 3rem;
    animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) 0.36s both;
  }

  .card-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .card-company-row { display: flex; align-items: center; gap: 10px; }

  .card-company-name {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #1A1714;
    letter-spacing: -0.01em;
  }

  .sample-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #C4BBB0;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .pills-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1rem; }

  .card-sentence {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 400;
    color: #3A3028;
    line-height: 1.75;
  }

  .how-strip {
    width: 100%;
    max-width: 520px;
    padding: 2rem 0;
    border-top: 1px solid #E8E3DC;
    margin-bottom: 2rem;
    animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) 0.44s both;
  }

  .how-line {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-weight: 400;
    font-size: 15px;
    color: #8A8074;
    margin-bottom: 0.4rem;
  }

  .how-sources {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #C4BBB0;
    letter-spacing: 0.06em;
    margin-bottom: 0.7rem;
  }

  .how-conclusion {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #1A1714;
    margin-top: 0.4rem;
  }

  .stream-wrap {
    width: 100%;
    max-width: 520px;
    padding: 1.5rem 0 2.5rem;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    border-top: 1px solid #E8E3DC;
    animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s both;
  }

  .stream-live {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #F7F3EC;
    background: #A0522D;
    padding: 2px 7px;
    border-radius: 999px;
    letter-spacing: 0.06em;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .stream-items { display: flex; flex-direction: column; gap: 4px; transition: opacity 0.3s ease; }
  .stream-items.hidden { opacity: 0; }

  .stream-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #B0A89E;
  }

  .stream-company { color: #1A1714; font-weight: 500; }
  .stream-tag { color: #A0522D; }
  .stream-sep { color: #D9D4CE; }
  .stream-time { color: #C4BBB0; }
`

const RESULT_CSS = `
  .result-root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2.5rem 1.5rem 4rem;
  }

  .result-topbar {
    width: 100%;
    max-width: 680px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3rem;
  }

  .back-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #B0A89E;
    background: none;
    border: none;
    cursor: pointer;
    letter-spacing: 0.04em;
    padding: 0;
    transition: color 0.15s;
  }

  .back-btn:hover { color: #1A1714; }

  .result-wrap { width: 100%; max-width: 680px; }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    animation: rise 0.5s cubic-bezier(0.16,1,0.3,1) both;
  }

  .result-company-row { display: flex; align-items: center; gap: 14px; }

  .result-logo {
    width: 44px; height: 44px;
    border-radius: 10px;
    object-fit: contain;
    background: #F7F3EC;
    border: 1px solid #E8E3DC;
    padding: 5px;
  }

  .result-logo-fallback {
    width: 44px; height: 44px;
    border-radius: 10px;
    background: #EDE9E2;
    border: 1px solid #E8E3DC;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 18px; font-weight: 700; color: #8A8074;
    text-transform: uppercase;
  }

  .result-company-name {
    font-family: 'Playfair Display', serif;
    font-size: 26px; font-weight: 700;
    color: #1A1714; text-transform: capitalize;
    letter-spacing: -0.02em; line-height: 1.1;
  }

  .result-headline {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 14px; font-weight: 400;
    color: #B0A89E; margin-top: 3px;
  }

  .result-sentiment {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; letter-spacing: 0.05em;
    padding: 4px 11px; border-radius: 999px;
    margin-top: 6px; flex-shrink: 0;
  }

  .result-divider { height: 1px; background: #E8E3DC; margin: 1.5rem 0; }

  .result-section { animation: rise 0.5s cubic-bezier(0.16,1,0.3,1) both; }

  .result-section-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; letter-spacing: 0.1em;
    text-transform: uppercase; color: #C4BBB0; margin-bottom: 1rem;
  }

  .bars-list { display: flex; flex-direction: column; gap: 10px; }

  .bar-row {
    display: grid;
    grid-template-columns: 190px 1fr 28px;
    align-items: center;
    gap: 14px;
  }

  .bar-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 300; color: #6B5E52;
  }

  .bar-track {
    height: 2px;
    background: #EDE9E2;
    border-radius: 2px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: #1A1714;
    border-radius: 2px;
    width: 0;
    transition: width 0.9s cubic-bezier(0.16,1,0.3,1);
  }

  .bar-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: #B0A89E; text-align: right;
  }

  .signals-list { display: flex; flex-direction: column; gap: 14px; }

  .signal-row {
    display: grid;
    grid-template-columns: 28px 72px 1fr;
    gap: 14px;
    align-items: baseline;
  }

  .signal-n {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: #C4BBB0; letter-spacing: 0.04em;
  }

  .signal-type {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: #A0522D; letter-spacing: 0.04em;
  }

  .signal-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 300; color: #6B5E52; line-height: 1.6;
  }

  .our-read {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 300;
    color: #3A3028; line-height: 1.85;
    letter-spacing: 0.005em;
  }

  .result-search-wrap { width: 100%; margin-bottom: 2rem; }
`

function BarFill({ strength, delay }) {
  const ref = useRef(null)
  useEffect(() => {
    const t = setTimeout(() => {
      if (ref.current) ref.current.style.width = `${strength}%`
    }, delay + 200)
    return () => clearTimeout(t)
  }, [strength, delay])
  return <div ref={ref} className="bar-fill" />
}

function ResultPage({ result, sentiment, logoError, setLogoError, onBack }) {
  const categories = [
    { label: "Engineering & infra", strength: 82 },
    { label: "AI / ML", strength: 74 },
    { label: "Product hiring", strength: 61 },
    { label: "Open source activity", strength: 55 },
    { label: "News coverage", strength: 43 },
  ]
  const keySignals = [
    { n: "01", type: "Hiring", text: "Recent postings indicate concentrated growth in engineering and infrastructure — roles skewing senior and specialist." },
    { n: "02", type: "GitHub", text: "Commit activity across public repositories shows accelerating development velocity, with infrastructure and tooling repos receiving the most attention." },
    { n: "03", type: "News", text: "Media coverage concentrated around product launches and strategic partnerships, with sentiment broadly positive." },
    { n: "04", type: "People", text: "Leadership communications signal organizational momentum and a push toward platform-level positioning." },
  ]
  return (
    <div className="result-root">
      <style>{BASE_CSS + RESULT_CSS}</style>
      <div className="result-topbar">
        <div className="wordmark">PulseBoard</div>
        <button className="back-btn" onClick={onBack}>← new search</button>
      </div>
      <div className="result-wrap">
        <div className="result-header">
          <div className="result-company-row">
            {logoError
              ? <div className="result-logo-fallback">{result.company[0].toUpperCase()}</div>
              : <img className="result-logo"
                  src={`https://logo.clearbit.com/${result.company}.com`}
                  alt={result.company} onError={() => setLogoError(true)} />}
            <div>
              <h1 className="result-company-name">{result.company}</h1>
              <div className="result-headline">What they're actually building</div>
            </div>
          </div>
          {sentiment && (
            <span className="result-sentiment"
              style={{ background: sentiment.bg, color: sentiment.color }}>
              {sentiment.label}
            </span>
          )}
        </div>
        <div className="result-divider" />
        <div className="result-section">
          <div className="result-section-label">signal strength</div>
          <div className="bars-list">
            {categories.map((c, i) => (
              <div key={i} className="bar-row">
                <span className="bar-label">{c.label}</span>
                <div className="bar-track">
                  <BarFill strength={c.strength} delay={i * 80} />
                </div>
                <span className="bar-val">{c.strength}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="result-divider" />
        <div className="result-section">
          <div className="result-section-label">key signals</div>
          <div className="signals-list">
            {keySignals.map((s, i) => (
              <div key={i} className="signal-row">
                <span className="signal-n">{s.n}</span>
                <span className="signal-type">{s.type}</span>
                <span className="signal-text">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="result-divider" />
        <div className="result-section">
          <div className="result-section-label">our read</div>
          <p className="our-read">{result.summary}</p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [company, setCompany]     = useState("")
  const [loading, setLoading]     = useState(false)
  const [btnLabel, setBtnLabel]   = useState("analyze →")
  const [result, setResult]       = useState(null)
  const [logoError, setLogoError] = useState(false)
  const [focused, setFocused]     = useState(false)
  const [view, setView]           = useState("home")
  const [streamPos, setStreamPos] = useState(0)
  const [streamVisible, setStreamVisible] = useState(true)
  const ws = useRef(null)

  const WS_URL = (import.meta.env.VITE_WS_URL || "http://localhost:8000")
    .replace("https://", "wss://").replace("http://", "ws://")

  useEffect(() => {
    const iv = setInterval(() => {
      setStreamVisible(false)
      setTimeout(() => {
        setStreamPos(p => (p + 1) % STREAM.length)
        setStreamVisible(true)
      }, 350)
    }, 3200)
    return () => clearInterval(iv)
  }, [])

  const cycleStatus = () => {
    STATUS_SEQ.forEach((s, i) => {
      setTimeout(() => setBtnLabel(s), STATUS_DELAYS[i])
    })
  }

  const search = () => {
    if (!company.trim() || loading) return
    setLoading(true); setResult(null); setLogoError(false); setView("home")
    cycleStatus()
    ws.current = new WebSocket(`${WS_URL}/ws/${company.trim().toLowerCase()}`)
    ws.current.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.status === "complete") {
        setResult(d); setLoading(false); setBtnLabel("analyze →"); setView("result")
      } else if (d.status === "error") {
        setBtnLabel("server's playing hard to get →")
        setLoading(false)
        setTimeout(() => setBtnLabel("analyze →"), 2500)
      }
    }
    ws.current.onerror = () => {
      setBtnLabel("pipeline took a personal day →")
      setLoading(false)
      setTimeout(() => setBtnLabel("analyze →"), 2500)
    }
  }

  const sentiment = result
    ? SENTIMENT[result.sentiment?.toLowerCase()] || SENTIMENT.neutral
    : null

  if (view === "result" && result) {
    return (
      <ResultPage
        result={result}
        sentiment={sentiment}
        logoError={logoError}
        setLogoError={setLogoError}
        onBack={() => { setView("home"); setResult(null); setCompany("") }}
      />
    )
  }

  return (
    <>
      <style>{BASE_CSS + HOME_CSS}</style>
      <div className="home-topbar">
        <div className="wordmark">PulseBoard</div>
        <div className="topbar-badge">live · v1.0</div>
      </div>

      <div className="hero">
        <span className="hero-line1">What is this company</span>
        <span className="hero-line2">actually building?</span>
        <p className="hero-sub">
          Real-time signals from GitHub, news, and hiring data — synthesized by AI.
        </p>
      </div>

      <div className="home-search-wrap">
        <div className={`search-inner${focused ? " focused" : ""}`}>
          <input
            className="search-input"
            type="text"
            placeholder="google, stripe, airbnb..."
            value={company}
            onChange={e => setCompany(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <button className="search-btn" onClick={search} disabled={loading}>
            {btnLabel}
          </button>
        </div>
      </div>

      <div className="sample-card">
        <div className="card-header-row">
          <div className="card-company-row">
            <img className="company-logo-sm"
              src="https://logo.clearbit.com/stripe.com"
              alt="Stripe"
              onError={e => { e.target.style.display = "none" }} />
            <span className="card-company-name">Stripe</span>
          </div>
          <span className="sample-label">sample output</span>
        </div>
        <div className="pills-row">
          {SAMPLE_PILLS.map((p, i) => (
            <span key={i} className="signal-pill"
              style={{ animationDelay: `${0.4 + i * 0.15}s` }}>
              <span className="pill-glyph">{p.g}</span>{p.label}
            </span>
          ))}
        </div>
        <div className="card-divider" />
        <p className="card-sentence">
          Increasingly concentrated in infrastructure and ML roles, with recent GitHub
          activity pointing toward a major payments API overhaul and new AI-native
          developer tooling.
        </p>
        <div className="card-divider" />
        <div className="metrics-row">
          <span className="metric">Sources <span className="metric-val">31</span></span>
          <span className="metric-sep">·</span>
          <span className="metric">Confidence <span className="metric-val">84%</span></span>
          <span className="metric-sep">·</span>
          <span className="metric">Updated <span className="metric-val">2m</span></span>
          <span className="metric-sep">·</span>
          <span className="metric">Signals <span className="metric-val">17</span></span>
          <span className="live-dot" />
        </div>
      </div>

      <div className="how-strip">
        <p className="how-line">Companies leave traces.</p>
        <p className="how-sources">GitHub · Hiring · News · People · Products</p>
        <p className="how-line">We connect them.</p>
        <p className="how-conclusion">You see what they're actually building.</p>
      </div>

      <div className="stream-wrap">
        <span className="stream-live">live</span>
        <div className={`stream-items${streamVisible ? "" : " hidden"}`}>
          {[0, 1, 2].map(off => {
            const item = STREAM[(streamPos + off) % STREAM.length]
            return (
              <div key={off} className="stream-item">
                <span className="stream-company">{item.company}</span>
                <span className="stream-tag">{item.tag}</span>
                <span className="stream-sep">·</span>
                <span className="stream-time">{item.t}</span>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
