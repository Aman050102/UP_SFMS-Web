import { useState, useEffect } from "react";
import "../styles/login.css";

const API = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function getCookie(name: string) {
  const m = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

const primeCsrf = async () => {
  try {
    await fetch(`${API}/auth/csrf/`, { credentials: "include" });
  } catch {}
};

type Role = "person" | "staff";

export default function Login() {
  const [role, setRole] = useState<Role>("person");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false); // 👁 state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    primeCsrf();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get("role");
    if (r === "staff" || r === "person") setRole(r);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    try {
      setLoading(true);
      await primeCsrf();
      const csrftoken = getCookie("csrftoken");

      const res = await fetch(`${API}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken,
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
          role,
          remember: true,
        }),
      });

      if (!res.ok) throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");

      const data = await res.json();
      window.location.href = data?.next
        ? data.next
        : role === "staff"
        ? "/staff/menu"
        : "/user/menu";
    } catch (err: any) {
      setError(err?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <img src="/img/dsa.png" alt="กองกิจการนิสิต" />
        </div>

        <h1 className="login-title-th">ระบบจัดการข้อมูลสนามกีฬา</h1>
        <h2 className="login-title-th">กองกิจการนิสิต มหาวิทยาลัยพะเยา</h2>
        <p className="login-title-en">UP-FMS | UP - Field Management System</p>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="field">
            <span className="field-label">Username</span>
            <input
              type="text"
              placeholder="Student Code"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>

          {/* รหัสผ่าน + ไอคอนตา */}
          <label className="field">
            <span className="field-label">Password</span>
            <div className="field-input-with-toggle">
              <input
                type={showPw ? "text" : "password"}
                placeholder="your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              <button
                type="button"
                className="pw-eye-btn"
                onClick={() => setShowPw((v) => !v)}
              >
                {showPw ? (
                  // 👁 ตาเปิด
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <path
                      fill="currentColor"
                      d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
                    />
                  </svg>
                ) : (
                  // 👁 ตาปิด
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <path
                      fill="currentColor"
                      d="M1 1 23 23M9.9 4.24A10.75 10.75 0 0 1 12 4c7 0 11 7 11 7a21.8 21.8 0 0 1-2.2 3.39M6.47 6.47A10.75 10.75 0 0 0 1 11s4 7 11 7a11 11 0 0 0 5.47-1.47"
                    />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => (window.location.href = `/register?role=${role}`)}
          >
            สร้างบัญชีใหม่
          </button>
        </form>
      </div>
    </div>
  );
}
