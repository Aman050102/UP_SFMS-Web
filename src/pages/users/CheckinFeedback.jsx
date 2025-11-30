// src/pages/CheckinFeedback.jsx
import React, { useEffect, useState } from "react";
import HeaderUser from "../../components/HeaderUser";
import "../../styles/checkin_feedback.css";

const BACKEND = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(
  /\/$/,
  ""
);

function formatThaiDate(date) {
  const parts = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(date);
  const thaiYear = date.getFullYear() + 543;
  return parts
    .map((p) => (p.type === "year" ? String(thaiYear) : p.value))
    .join("");
}

export default function CheckinFeedback() {
  const [staffName, setStaffName] = useState("ผู้ใช้งาน");
  const [problems, setProblems] = useState("");
  const [detail, setDetail] = useState("");
  const [suggest, setSuggest] = useState("");
  const [improve, setImprove] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayThai = formatThaiDate(today);

  // ตรวจสิทธิ์เข้าแบบประเมิน: ต้องเช็คอินครบทุกสนามก่อน
  useEffect(() => {
    const doneDate = localStorage.getItem("checkin_all_done_date");
    if (!doneDate || doneDate !== todayStr) {
      alert("กรุณาเช็คอินสนามครบทุกประเภทของวันนี้ก่อน แล้วจึงทำแบบประเมิน");
      window.location.href = "/checkin";
      return;
    }

    // ดึงชื่อผู้ใช้จาก global / localStorage
    const dn =
      window.CURRENT_USER || localStorage.getItem("display_name") || "ผู้ใช้งาน";
    setStaffName(dn);
  }, [todayStr]);

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
  };

  const canSubmit =
    problems.trim() !== "" ||
    detail.trim() !== "" ||
    suggest.trim() !== "" ||
    improve.trim() !== "" ||
    !!file;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!canSubmit) {
      setError("กรุณากรอกอย่างน้อย 1 ช่อง หรือแนบไฟล์ก่อนส่งแบบประเมิน");
      return;
    }

    try {
      setSubmitting(true);

      // ตัวอย่างเก็บเป็น FormData เผื่ออนาคตส่งเข้า backend
      const formData = new FormData();
      formData.append("date", todayStr);
      formData.append("staff_name", staffName);
      formData.append("problems", problems);
      formData.append("detail", detail);
      formData.append("suggest", suggest);
      formData.append("improve", improve);
      if (file) {
        formData.append("register_file", file);
      }

      // ตอนนี้ยังไม่ยิง backend จริง (กัน 404)
      // ถ้าจะใช้จริงค่อยเปลี่ยนเป็น fetch ไป endpoint:
      // await fetch(`${BACKEND}/api/checkin/feedback/`, { method: "POST", body: formData });

      console.log("CHECKIN_FEEDBACK_FORM", Object.fromEntries(formData.entries()));

      setOk("บันทึกแบบประเมินเรียบร้อย ขอบคุณสำหรับข้อมูล :)");
      setProblems("");
      setDetail("");
      setSuggest("");
      setImprove("");
      setFile(null);
    } catch (err) {
      setError("บันทึกแบบประเมินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  const onBackToMenu = () => {
    window.location.href = "/user/menu";
  };

  const displayName =
    window.CURRENT_USER || localStorage.getItem("display_name") || "ผู้ใช้งาน";

  return (
    <div data-page="checkin-feedback" className="wrap">
      <HeaderUser displayName={displayName} BACKEND={BACKEND} />
      <main>
        <section className="fb-card" aria-label="แบบประเมินปัญหาประจำวัน">
          {/* หัวข้อ */}
          <header className="fb-header">
            <h1>แบบประเมินปัญหาการใช้งานสนามกีฬา (รายวัน)</h1>
            <p className="fb-subtitle">
              โปรดบันทึกปัญหาและข้อเสนอแนะหลังจากเช็คอินครบทุกสนามของวันนี้
            </p>
          </header>

          {/* ข้อมูลพื้นฐาน */}
          <section className="fb-basic" aria-label="ข้อมูลพื้นฐาน">
            <div className="fb-basic-row">
              <div>
                <span className="fb-label">วันที่</span>
                <div className="fb-value">{todayThai}</div>
              </div>
              <div>
                <span className="fb-label">ผู้บันทึก</span>
                <div className="fb-value">{staffName}</div>
              </div>
            </div>
            <p className="fb-note">
              * แบบประเมินนี้ใช้สำหรับเก็บข้อมูลปัญหาในแต่ละวัน และช่วยปรับปรุงการให้บริการสนามกีฬา
            </p>
          </section>

          {/* ฟอร์มหลัก */}
          <form className="fb-form" onSubmit={onSubmit}>
            <div className="fb-field">
              <label className="fb-label" htmlFor="problems">
                ปัญหาที่พบในวันนี้
              </label>
              <textarea
                id="problems"
                className="fb-textarea"
                placeholder="เช่น อุปกรณ์ชำรุด, ระบบไฟสนามมีปัญหา, จองสนามซ้ำซ้อน ฯลฯ"
                value={problems}
                onChange={(e) => setProblems(e.target.value)}
              />
            </div>

            <div className="fb-field">
              <label className="fb-label" htmlFor="detail">
                รายละเอียดปัญหา
              </label>
              <textarea
                id="detail"
                className="fb-textarea"
                placeholder="อธิบายว่าเกิดอะไรขึ้น ช่วงเวลาไหน สนามใด มีใครได้รับผลกระทบบ้าง"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
              />
            </div>

            <div className="fb-field">
              <label className="fb-label" htmlFor="suggest">
                ข้อเสนอแนะ
              </label>
              <textarea
                id="suggest"
                className="fb-textarea"
                placeholder="เสนอวิธีการแก้ไขหรือป้องกันปัญหานี้ในอนาคต"
                value={suggest}
                onChange={(e) => setSuggest(e.target.value)}
              />
            </div>

            <div className="fb-field">
              <label className="fb-label" htmlFor="improve">
                สิ่งที่อยากให้ปรับปรุงเพิ่มเติม
              </label>
              <textarea
                id="improve"
                className="fb-textarea"
                placeholder="เช่น อยากให้เพิ่มไฟส่องสว่าง, ปรับปรุงพื้นสนาม, เพิ่มเจ้าหน้าที่ช่วงเวลาเร่งด่วน ฯลฯ"
                value={improve}
                onChange={(e) => setImprove(e.target.value)}
              />
            </div>

            <div className="fb-field">
              <label className="fb-label" htmlFor="file">
                แนบไฟล์รูปถ่ายกระดาษลงทะเบียนวันนี้
              </label>
              <p className="fb-help">
                อัปโหลดรูปถ่ายกระดาษลงทะเบียน หรือไฟล์สแกน (รองรับ JPG, PNG, PDF)
              </p>
              <div className="fb-file-box">
                <input
                  id="file"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={onFileChange}
                />
                {file && (
                  <div className="fb-file-name">ไฟล์ที่เลือก: {file.name}</div>
                )}
              </div>
            </div>

            {error && <p className="fb-error">{error}</p>}
            {ok && <p className="fb-ok">{ok}</p>}

            <div className="fb-actions">
              <button
                type="submit"
                className="fb-btn-primary"
                disabled={submitting || !canSubmit}
              >
                {submitting ? "กำลังบันทึก..." : "ยืนยันการส่งแบบประเมิน"}
              </button>
              <button
                type="button"
                className="fb-btn-ghost"
                onClick={onBackToMenu}
              >
                กลับไปหน้าเมนูนิสิตช่วยงาน
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
