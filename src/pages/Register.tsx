// src/pages/Register.tsx
import { useEffect, useMemo, useState } from "react";
import "../styles/register.css";

const API = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
type Role = "person" | "staff";

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+$/.test(s.trim());

function getCookie(name: string) {
  const m = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

const primeCsrf = async () => {
  try {
    await fetch(`${API}/auth/csrf/`, { credentials: "include" });
  } catch {}
};

export default function Register() {
  // preset role จาก ?role=
  const [role, setRole] = useState<Role>("person");
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const r = q.get("role");
    if (r === "staff" || r === "person") setRole(r);
  }, []);

  // ทุกบทบาท
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  // 👁 state สำหรับแสดง/ซ่อนรหัสผ่าน
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  // เฉพาะนิสิตช่วยงาน
  const [studentId, setStudentId] = useState("");
  const [faculty, setFaculty] = useState("");

  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const faculties = useMemo(
    () => [
      "คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ",
      "คณะพลังงานและสิ่งแวดล้อม",
      "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
      "คณะพยาบาลศาสตร์",
      "คณะแพทยศาสตร์",
      "คณะทันตแพทยศาสตร์",
      "คณะสาธารณสุขศาสตร์",
      "คณะเภสัชศาสตร์",
      "คณะสหเวชศาสตร์",
      "คณะวิศวกรรมศาสตร์",
      "คณะวิทยาศาสตร์",
      "คณะวิทยาศาสตร์การแพทย์",
      "คณะรัฐศาสตร์และสังคมศาสตร์",
      "คณะนิติศาสตร์",
      "คณะบริหารธุรกิจและนิเทศศาสตร์",
      "คณะศิลปศาสตร์",
      "คณะสถาปัตยกรรมศาสตร์และศิลปกรรมศาสตร์",
      "วิทยาลัยการศึกษา",
    ],
    []
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!username || !email || !pw || !pw2)
      return setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");

    if (!isEmail(email)) return setError("รูปแบบอีเมลไม่ถูกต้อง");
    if (pw !== pw2) return setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");

    if (role === "person") {
      if (!/^6\d{7}$/.test(studentId))
        return setError("รหัสนิสิตต้องขึ้นต้นด้วย 6 และมี 8 หลัก");
      if (!faculty) return setError("กรุณาเลือกคณะ");
    }

    try {
      await primeCsrf();
      const csrftoken = getCookie("csrftoken");

      const payload =
        role === "person"
          ? {
              role,
              username,
              email,
              password: pw,
              student_id: studentId,
              faculty,
            }
          : { role, username, email, password: pw };

      const res = await fetch(`${API}/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken || "",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (!res.ok || !data?.ok) {
        const msg =
          data?.error || `สมัครสมาชิกไม่สำเร็จ (HTTP ${res.status})`;
        throw new Error(msg);
      }

      setOk("สมัครสมาชิกสำเร็จ! กำลังพาไปหน้าเข้าสู่ระบบ…");
      const nextRole = role;
      setTimeout(() => (window.location.href = `/login?role=${nextRole}`), 900);
    } catch (err: any) {
      const msg = (err?.message || "").includes("Failed to fetch")
        ? "เชื่อมต่อไม่ได้ (CORS/เครือข่าย) ตรวจค่า VITE_API_BASE_URL และการเปิดเซิร์ฟเวอร์ 8000"
        : err?.message || "เกิดข้อผิดพลาด";
      setError(msg);
    }
  };

  return (
    <div className="login-bg reg-bg">
      <div className="login-card reg-card">
        {/* โลโก้กองกิจ */}
        <div className="login-logo">
          <img src="/img/dsa.png" alt="กองกิจการนิสิต" />
        </div>

        {/* หัวข้อสองภาษา */}
        <h1 className="login-title-th">Create a new account</h1>
        <p className="login-title-en">
          UP - Field Management System (UP-FMS)
        </p>

        {/* แสดงว่าเรากำลังสร้างบัญชีประเภทไหน */}
        <p className="reg-subtitle">
          Account type:
          <strong> {role === "person" ? "นิสิตช่วยงาน" : "แอดมิน"}</strong>
        </p>

        {/* สวิตช์เลือกบทบาทเหมือน segmented control */}
        <div className="segmented-row">
          <div
            className="segmented segmented-lg"
            role="tablist"
            aria-label="เลือกประเภทบัญชี"
          >
            <button
              type="button"
              role="tab"
              aria-selected={role === "person"}
              onClick={() => setRole("person")}
            >
              นิสิตช่วยงาน
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === "staff"}
              onClick={() => setRole("staff")}
            >
              แอดมิน
            </button>
            <span
              className="segmented-indicator"
              aria-hidden="true"
              style={{
                transform:
                  role === "person" ? "translateX(0%)" : "translateX(100%)",
                width: "50%",
              }}
            />
          </div>
        </div>

        <form className="reg-form" onSubmit={submit} noValidate>
          <div className="row2">
            <label className="field">
              <span className="field-label">
                ชื่อผู้ใช้ / Username
                <small> (ใช้สำหรับเข้าสู่ระบบ)</small>
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span className="field-label">
                อีเมล / E-mail
                {role === "staff" && (
                  <small> (แนะนำให้ใช้อีเมล @up.ac.th)</small>
                )}
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="row2">
            {/* Password */}
            <label className="field">
              <span className="field-label">รหัสผ่าน / Password</span>
              <div className="field-input-with-toggle">
                <input
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="pw-eye-btn"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPw ? (
                    // ตาเปิด
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <path
                        fill="currentColor"
                        d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
                      />
                    </svg>
                  ) : (
                    // ตาปิด
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

            {/* Confirm Password */}
            <label className="field">
              <span className="field-label">
                ยืนยันรหัสผ่าน / Confirm password
              </span>
              <div className="field-input-with-toggle">
                <input
                  type={showPw2 ? "text" : "password"}
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="pw-eye-btn"
                  onClick={() => setShowPw2((v) => !v)}
                  aria-label={showPw2 ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPw2 ? (
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <path
                        fill="currentColor"
                        d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
                      />
                    </svg>
                  ) : (
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
          </div>

          {role === "person" && (
            <div className="row2">
              <label className="field">
                <span className="field-label">
                  รหัสนิสิต / Student ID
                  <small> (ขึ้นต้นด้วย 6 รวม 8 หลัก)</small>
                </span>
                <input
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span className="field-label">คณะ / Faculty</span>
                <select
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  required
                >
                  <option value="">— เลือกคณะ —</option>
                  {faculties.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {error && <p className="error-msg">{error}</p>}
          {ok && <p className="ok-msg">{ok}</p>}

          <button className="btn-login" type="submit">
            Create account
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => (window.location.href = `/login?role=${role}`)}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
