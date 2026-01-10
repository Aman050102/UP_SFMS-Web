import { useState } from "react";
import "../styles/register.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8787").replace(/\/$/, "");

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+$/.test(s.trim());

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!fullName || !email || !username || !pw || !pw2) return setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
    if (!isEmail(email)) return setError("รูปแบบอีเมลไม่ถูกต้อง");
    if (pw !== pw2) return setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
    if (pw.length < 6) return setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");

    try {
      const payload = {
        full_name: fullName,
        email: email,
        username: username,
        password: pw,
        // ส่งสถานะเริ่มต้นไปที่ Backend ให้รออนุมัติ (Pending)
        is_approved: false
      };

      const res = await fetch(`${API}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || `สมัครสมาชิกไม่สำเร็จ`);

      setOk("ลงทะเบียนสำเร็จ! กรุณารอแอดมินตรวจสอบและอนุมัติบัญชีของคุณ");
      setTimeout(() => (window.location.href = "/login"), 3000);
    } catch (err: any) {
      setError(err?.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  return (
    <div className="login-bg reg-bg">
      <div className="login-card reg-card">
        <div className="login-logo"><img src="/img/dsa.png" alt="กองกิจการนิสิต" /></div>
        <h1 className="login-title-th">สร้างบัญชีผู้ใช้งานใหม่</h1>
        <p className="login-title-en">UP - Field Management System (UP-FMS)</p>
        <p className="reg-subtitle">สมัครสมาชิกเพื่อเข้าใช้งานระบบ</p>

        <form className="reg-form" onSubmit={submit} noValidate>
          <div className="row1">
            <label className="field">
              <span className="field-label">ชื่อ-นามสกุล / Full Name</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="นาย ใจดี มีสุข" />
            </label>
          </div>

          <div className="row2">
            <label className="field">
              <span className="field-label">อีเมล / E-mail</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="example@up.ac.th" />
            </label>
            <label className="field">
              <span className="field-label">ชื่อผู้ใช้ / Username</span>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="สำหรับใช้ Login" />
            </label>
          </div>

          <div className="row2">
            <label className="field">
              <span className="field-label">รหัสผ่าน / Password</span>
              <div className="field-input-with-toggle">
                <input type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} required />
                <button type="button" className="pw-eye-btn" onClick={() => setShowPw((v) => !v)}>
                  {showPw ? <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"/></svg>
                          : <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M1 1 23 23M9.9 4.24A10.75 10.75 0 0 1 12 4c7 0 11 7 11 7a21.8 21.8 0 0 1-2.2 3.39M6.47 6.47A10.75 10.75 0 0 0 1 11s4 7 11 7a11 11 0 0 0 5.47-1.47"/></svg>}
                </button>
              </div>
            </label>
            <label className="field">
              <span className="field-label">ยืนยันรหัสผ่าน / Confirm Password</span>
              <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
            </label>
          </div>

          {error && <p className="error-msg">{error}</p>}
          {ok && <p className="ok-msg">{ok}</p>}

          <button className="btn-login" type="submit">ลงทะเบียนและรอการตรวจสอบ</button>
          <button type="button" className="btn-secondary" onClick={() => (window.location.href = "/login")}>ยกเลิกและกลับไปหน้าล็อกอิน</button>
        </form>
      </div>
    </div>
  );
}
