"use client"

import { useState } from "react"

function Login({ setIsAuthenticated }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Simulate API call
    setTimeout(() => {
      if (username === "admin" && password === "123456") {
        localStorage.setItem("isAuthenticated", "true")
        setIsAuthenticated(true)
      } else {
        setError("Login yoki parol noto'g'ri")
      }
      setLoading(false)
    }, 1000)
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div className="card" style={{ width: "400px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "24px" }}>CRM Panel</h2>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label>Foydalanuvchi nomi</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label>Parol</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="123456"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Kirish..." : "Kirish"}
          </button>
        </form>

        <div style={{ marginTop: "16px", textAlign: "center", fontSize: "14px", color: "#6b7280" }}>
          Demo: admin / 123456
        </div>
      </div>
    </div>
  )
}

export default Login
