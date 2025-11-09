// src/pages/Login.tsx
import { useEffect, useState } from "react";
import "../styles/login.css";

const API = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

// อ่านค่า csrftoken จาก cookie (ใช้กับ Django)
function getCookie(name: string) {
  const m = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

// เรียก /auth/csrf/ ล่วงหน้าให้ Django ตั้ง csrftoken
const primeCsrf = async () => {
  try {
    await fetch(`${API}/auth/csrf/`, { credentials: "include" });
  } catch {
    // เงียบไว้ก่อน (ถ้า offline ให้ลอง login ได้อยู่)
  }
};

export default function Login() {
  // ตั้งค่าเริ่มต้นเป็นนิสิตช่วยงาน ("person")
  const [role, setRole] = useState<"staff" | "person">("person");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  // อ่าน ?role= จาก URL เพื่อ preset ปุ่ม
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get("role");
    if (r === "staff" || r === "person") setRole(r);
  }, []);

  // เติม username ล่าสุด
  useEffect(() => {
    const last = localStorage.getItem("last_username");
    if (last) setUsername(last);
  }, []);

  // เตรียม CSRF ตั้งแต่ mount (กันกรณีรีเควสแรกยังไม่มี cookie)
  useEffect(() => {
    primeCsrf();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    try {
      // กันไว้เผื่อ cookie ยังไม่ถูกตั้ง
      await primeCsrf();
      const csrftoken = getCookie("csrftoken");

      const res = await fetch(`${API}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken || "",
        },
        credentials: "include",
        body: JSON.stringify({ username, password, role, remember }),
      });

      if (!res.ok) {
        if (res.status === 401)
          throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        if (res.status === 403)
          throw new Error(
            "สิทธิไม่เพียงพอสำหรับเมนูที่เลือก (บัญชีบุคคลทั่วไปไม่สามารถเข้าเมนูเจ้าหน้าที่)",
          );
        throw new Error(`เข้าสู่ระบบไม่สำเร็จ (HTTP ${res.status})`);
      }

      const data = await res.json();
      localStorage.setItem("last_username", username);

      // backend ส่ง next มาให้เสมอ ถ้าไม่มาก็ fallback ให้ตรงกับโครงสร้างล่าสุด
      if (data?.next) {
        window.location.href = data.next;
      } else {
        const granted = data?.role_granted === "staff" ? "staff" : "person";
        window.location.href =
          granted === "staff" ? "/staff/menu" : "/user/menu";
      }
    } catch (err: any) {
      setError(err?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    }
  };

  return (
    <div data-page="login">
      <header className="topbar" aria-label="University Bar">
        <div className="brand-small" aria-label="DQSD logo small">
          <span>
            <img src="/img/logoDSASMART.png" alt="DSA" height={100} />
          </span>
        </div>
      </header>

      <main className="wrap">
        <section className="card" role="region" aria-labelledby="login-title">
          {/* ปุ่มสลับบทบาท */}
          <div className="segmented-row">
            <div
              className="segmented segmented-lg"
              role="tablist"
              aria-label="ประเภทผู้ใช้"
            >
              <button
                role="tab"
                aria-selected={role === "staff"}
                onClick={() => setRole("staff")}
                type="button"
              >
                เจ้าหน้าที่
              </button>
              <button
                role="tab"
                aria-selected={role === "person"}
                onClick={() => setRole("person")}
                type="button"
              >
                นิสิตช่วยงาน
              </button>
              <span
                className="segmented-indicator"
                aria-hidden="true"
                style={{
                  transform:
                    role === "staff" ? "translateX(0%)" : "translateX(100%)",
                  width: "50%",
                }}
              />
            </div>
          </div>

          {/* ฟอร์มล็อกอิน */}
          <form className="login-form" onSubmit={onSubmit} noValidate>
            <label className="input-row">
              <span className="icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </label>

            <label className="input-row">
              <span className="icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V8a5 5 0 0 1 10 0v3" />
                </svg>
              </span>
              <input
                type={showPw ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="icon-btn"
                aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                onClick={() => setShowPw((v) => !v)}
              >
                {showPw ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.58-1.36 1.44-2.63 2.53-3.76M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a11.77 11.77 0 0 1-2.2 3.4M1 1l22 22" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </label>

            <div className="row meta">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a
                className="forgot"
                href="https://password.up.ac.th/"
                target="_blank"
                rel="noreferrer"
              >
                Forgot password?
              </a>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="login-btn">
              LOGIN
            </button>

            <p className="hint">
              ถ้าไม่มีบัญชี ให้{" "}
              <a href={`/register?role=${role}`} className="link">
                ลงทะเบียนก่อน
              </a>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
