"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, LogIn, User, Lock, BookOpenCheck } from "lucide-react";
import LoginLoading from "../components/LoginLoading";
import API_URL from "../conf/api";

/* ── Animated grid background ── */
function GridCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const CELL = 48;

    const palettes = [
      ["#c7d2fe", "#ddd6fe", "#bfdbfe", "#e0e7ff", "#fce7f3"],
      ["#a5f3fc", "#a7f3d0", "#bbf7d0", "#d1fae5", "#e0f2fe"],
      ["#fde68a", "#fca5a5", "#fdba74", "#fcd34d", "#f9a8d4"],
      ["#c4b5fd", "#a5b4fc", "#93c5fd", "#6ee7b7", "#fca5a5"],
    ];
    let paletteIdx = 0;
    let nextPaletteIdx = 1;
    let paletteLerp = 0;
    const paletteSpeed = 0.0025;

    function lerpColor(a, b, t) {
      const ah = parseInt(a.slice(1), 16);
      const bh = parseInt(b.slice(1), 16);
      const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
      const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
      return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`;
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    let rafId;

    function draw() {
      frame++;
      paletteLerp += paletteSpeed;
      if (paletteLerp >= 1) {
        paletteLerp = 0;
        paletteIdx = nextPaletteIdx;
        nextPaletteIdx = (nextPaletteIdx + 1) % palettes.length;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cols = Math.ceil(canvas.width / CELL) + 1;
      const rows = Math.ceil(canvas.height / CELL) + 1;
      const curP = palettes[paletteIdx];
      const nxtP = palettes[nextPaletteIdx];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ci = (r + c) % curP.length;
          const ni = (r + c) % nxtP.length;
          const wave = Math.sin(frame * 0.01 + (r + c) * 0.55) * 0.5 + 0.5;
          const alpha = 0.15 + wave * 0.18;
          const col = lerpColor(curP[ci], nxtP[ni], paletteLerp);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = col;
          ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1);
        }
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        display: "block",
      }}
    />
  );
}

/* ── Main component ── */
function TeacherLogin({ setTeacherAuthenticated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/teacher_login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success") {
        setTeacherAuthenticated(true);
        setShowSuccess(true);
        setTimeout(() => navigate("/teacher/dashboard"), 1500);
      } else {
        toast.error(data.message || "Login xatolik");
        setLoading(false);
      }
    } catch (err) {
      toast.error(`Server bilan aloqa xatolik: ${err}`);
      setLoading(false);
    }
  };

  return (
    <div className="tl-root">
      <GridCanvas />

      {/* Blob accents */}
      <div className="blob blob-tr" />
      <div className="blob blob-bl" />

      {/* Success overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="success-inner"
              initial={{ scale: 0.5, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div className="s-check">
                <svg viewBox="0 0 52 52" style={{ width: "100%", height: "100%" }}>
                  <circle cx="26" cy="26" r="25" fill="none" className="s-circle" />
                  <path d="M14.1 27.2l7.1 7.2 16.7-16.8" fill="none" className="s-path" />
                </svg>
              </div>
              <p className="s-title">Muvaffaqiyatli kirildi!</p>
              <p className="s-sub">Dashboardga o'tkazilmoqda…</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card */}
      <motion.div
        className="tl-card"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo — exactly like screenshot */}
        <motion.div
          className="logo-wrap"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <img src="/logo.png" alt="Progress Logo" className="logo-img" />
        </motion.div>

        {/* Badge */}
        <motion.div
          className="badge-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
        >
          <span className="badge">
            <BookOpenCheck size={15} strokeWidth={2.2} />
            Ustozlar platformasi
          </span>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleLogin} className="tl-form" autoComplete="on">
          {/* Username */}
          <motion.div
            className="field"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label htmlFor="username" className="f-label">
              Foydalanuvchi nomingiz
            </label>
            <div className={`f-wrap ${focusedField === "username" ? "focused" : ""}`}>
              <User size={16} className="f-icon" />
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                className="f-input"
                placeholder="username"
                autoComplete="username"
                required
              />
            </div>
          </motion.div>

          {/* Password */}
          <motion.div
            className="field"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.38 }}
          >
            <label htmlFor="password" className="f-label">
              Parolingiz
            </label>
            <div className={`f-wrap ${focusedField === "password" ? "focused" : ""}`}>
              <Lock size={16} className="f-icon" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                className="f-input"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            className="tl-btn"
            whileHover={{ scale: loading ? 1 : 1.015 }}
            whileTap={{ scale: loading ? 1 : 0.975 }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46 }}
          >
            {loading ? (
              <LoginLoading className="w-5 h-5" />
            ) : (
              <>
                <LogIn size={18} />
                <span>Kirish</span>
              </>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <motion.p
          className="tl-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          © {new Date().getFullYear()} "Intellectual Progress Star". Ustozlar platformasi
        </motion.p>
      </motion.div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .tl-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 24px 16px;
          background: #f0f2ff;
        }

        /* blobs */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.5;
          z-index: 1;
          pointer-events: none;
        }
        .blob-tr { width: 280px; height: 280px; background: #c7d2fe; top: -70px; right: -50px; }
        .blob-bl { width: 240px; height: 240px; background: #ddd6fe; bottom: -60px; left: -40px; }

        /* card */
        .tl-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 430px;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,0.95);
          border-radius: 28px;
          padding: 32px 32px 26px;
          box-shadow: 0 8px 40px rgba(99,102,241,0.12), 0 2px 8px rgba(0,0,0,0.06);
        }

        /* logo */
        .logo-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 6px;
        }
        .logo-img {
          height: 230px;
          width: auto;
          object-fit: contain;
          display: block;
          position: absolute;
          top: 12%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        /* badge */
        .badge-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 26px;
          margin-top: 60px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #6366f1;
          font-size: 15px;
          font-weight: 600;
        }

        /* form */
        .tl-form { display: flex; flex-direction: column; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 7px; }
        .f-label { font-size: 13.5px; font-weight: 500; color: #374151; }

        /* input */
        .f-wrap {
          position: relative;
          display: flex;
          align-items: center;
          background: #eef0fb;
          border: 1.5px solid #e0e7ff;
          border-radius: 14px;
          transition: all 0.2s;
          overflow: hidden;
        }
        .f-wrap:hover { border-color: #a5b4fc; }
        .f-wrap.focused {
          border-color: #6366f1;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.13);
        }
        .f-icon {
          position: absolute;
          left: 14px;
          color: #a5b4fc;
          pointer-events: none;
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .f-wrap.focused .f-icon { color: #6366f1; }
        .f-input {
          width: 100%;
          padding: 13px 14px 13px 40px;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          color: #111827;
          caret-color: #6366f1;
        }
        .f-input::placeholder { color: #c4caed; }

        /* autocomplete fix */
        .f-input:-webkit-autofill,
        .f-input:-webkit-autofill:hover,
        .f-input:-webkit-autofill:focus,
        .f-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 40px #eef0fb inset !important;
          -webkit-text-fill-color: #111827 !important;
          caret-color: #6366f1;
          transition: background-color 9999s ease-in-out 0s;
        }
        .f-wrap.focused .f-input:-webkit-autofill,
        .f-wrap.focused .f-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 40px #ffffff inset !important;
        }

        .pw-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: #a5b4fc;
          display: flex;
          align-items: center;
          padding: 5px;
          border-radius: 8px;
          transition: color 0.2s, background 0.2s;
        }
        .pw-toggle:hover { color: #6366f1; background: rgba(99,102,241,0.07); }

        /* button */
        .tl-btn {
          margin-top: 4px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 15px 20px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(130deg, #6366f1 0%, #8b5cf6 55%, #a855f7 100%);
          box-shadow: 0 4px 22px rgba(99,102,241,0.38);
          transition: box-shadow 0.25s;
          position: relative;
          overflow: hidden;
        }
        .tl-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.13) 0%, transparent 55%);
          pointer-events: none;
        }
        .tl-btn:hover:not(:disabled) { box-shadow: 0 6px 30px rgba(99,102,241,0.48); }
        .tl-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* footer */
        .tl-footer {
          text-align: center;
          font-size: 11.5px;
          color: #9ca3af;
          margin-top: 20px;
        }

        /* success */
        .success-overlay {
          position: fixed; inset: 0; z-index: 100;
          display: flex; align-items: center; justify-content: center;
          background: rgba(240,242,255,0.82);
          backdrop-filter: blur(8px);
        }
        .success-inner { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .s-check { width: 80px; height: 80px; }
        .s-circle {
          stroke: #22c55e; stroke-width: 2;
          stroke-dasharray: 166; stroke-dashoffset: 166;
          animation: sdash 0.4s ease forwards;
        }
        .s-path {
          stroke: #22c55e; stroke-width: 3;
          stroke-linecap: round; stroke-linejoin: round;
          stroke-dasharray: 48; stroke-dashoffset: 48;
          animation: sdash 0.35s 0.35s ease forwards;
        }
        .s-title { color: #1e1b4b; font-weight: 700; font-size: 20px; }
        .s-sub   { color: #818cf8; font-size: 13px; }
        @keyframes sdash { to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}

export default TeacherLogin;