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
    [],
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
      // 1) ขอ CSRF cookie
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

      // 2) แนบ X-CSRFToken + credentials
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
        const msg = data?.error || `สมัครสมาชิกไม่สำเร็จ (HTTP ${res.status})`;
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
    <div data-page="register">
      <header className="topbar" aria-label="University Bar">
        <div className="brand-small" aria-label="DQSD logo small">
          <span>
            <img src="/img/logoDSASMART.png" alt="DSA" height={100} />
          </span>
        </div>
      </header>

      <main className="reg-wrap">
        <section className="reg-card">
          <h1 className="title">ลงทะเบียน</h1>

          {/* ปุ่มสลับบทบาท */}
          <div className="segmented-row">
            <div
              className="segmented segmented-lg"
              role="tablist"
              aria-label="บทบาท"
            >
              <button
                role="tab"
                aria-selected={role === "person"}
                onClick={() => setRole("person")}
              >
                นิสิตช่วยงาน
              </button>
              <button
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
              <label>
                <span>ชื่อผู้ใช้</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </label>
              <label>
                <span>อีเมล</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="row2">
              <label>
                <span>รหัสผ่าน</span>
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                />
              </label>
              <label>
                <span>ยืนยันรหัสผ่าน</span>
                <input
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  required
                />
              </label>
            </div>

            {role === "person" && (
              <div className="row2">
                <label>
                  <span>รหัสนิสิต</span>
                  <input
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>คณะ</span>
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

            {error && <p className="error">{error}</p>}
            {ok && <p className="ok">{ok}</p>}

            <button className="submit-btn" type="submit">
              สมัครสมาชิก
            </button>
            <p className="hint">
              มีบัญชีแล้ว? <a href={`/login?role=${role}`}>เข้าสู่ระบบ</a>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
