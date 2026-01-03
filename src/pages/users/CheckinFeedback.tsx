// src/pages/CheckinFeedback.tsx
import React, { useEffect, useState } from "react";
import HeaderUser from "../../components/HeaderUser";
import "../../styles/checkin_feedback.css";

const BACKEND = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

const FACILITY_LABELS = {
  outdoor: "สนามกลางแจ้ง",
  badminton: "สนามแบดมินตัน",
  track: "สนามลู่-ลาน",
  pool: "สระว่ายน้ำ",
};

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
  const [facility, setFacility] = useState(null);
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

  // ตรวจสิทธิ์เข้าแบบประเมิน: ต้องเช็คอิน "ประเภทสนามนี้" ครบก่อน
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const facParam = search.get("facility") || "outdoor";
    const allowed = ["outdoor", "badminton", "track", "pool"];
    const fac = allowed.includes(facParam) ? facParam : "outdoor";
    setFacility(fac);

    // ตรวจว่าเช็คอินครบแล้วหรือยัง
    let canAccess = false;
    try {
      const rawDone = localStorage.getItem("checkin_facility_done");
      if (rawDone) {
        const parsed = JSON.parse(rawDone);
        if (
          parsed.date === todayStr &&
          parsed.facilities &&
          parsed.facilities[fac]
        ) {
          canAccess = true;
        }
      }
    } catch {
      /* ignore */
    }

    if (!canAccess) {
      alert(
        "กรุณาเช็คอินสนามประเภทนี้ให้ครบก่อน แล้วจึงทำแบบประเมิน"
      );
      window.location.href = "/checkin";
      return;
    }

    // ถ้าเคยส่งแบบประเมินของสนามนี้แล้วในวันนี้ จะเตือน
    try {
      const rawFb = localStorage.getItem("checkin_facility_feedback");
      if (rawFb) {
        const parsed = JSON.parse(rawFb);
        if (
          parsed.date === todayStr &&
          parsed.facilities &&
          parsed.facilities[fac]
        ) {
          const label = FACILITY_LABELS[fac] || "สนามนี้";
          const goBack = window.confirm(
            `วันนี้ส่งแบบประเมินสำหรับ${label}แล้ว\nต้องการกลับไปหน้าเช็คอินหรือไม่?`
          );
          if (goBack) {
            window.location.href = "/checkin";
            return;
          }
        }
      }
    } catch {
      /* ignore */
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

      const formData = new FormData();
      formData.append("date", todayStr);
      formData.append("facility", facility || "");
      formData.append(
        "facility_label",
        FACILITY_LABELS[facility] || "สนามกีฬา"
      );
      formData.append("staff_name", staffName);
      formData.append("problems", problems);
      formData.append("detail", detail);
      formData.append("suggest", suggest);
      formData.append("improve", improve);
      if (file) {
        formData.append("register_file", file);
      }

      // TODO: ถ้า backend พร้อมให้ยิง endpoint นี้
      // await fetch(`${BACKEND}/api/checkin/feedback/`, {
      //   method: "POST",
      //   body: formData,
      // });

      console.log(
        "CHECKIN_FEEDBACK_FORM",
        Object.fromEntries(formData.entries())
      );

      // mark ว่าวันนี้ประเมินสนามนี้แล้ว
      try {
        let facilities = {};
        const rawFb = localStorage.getItem("checkin_facility_feedback");
        if (rawFb) {
          const parsed = JSON.parse(rawFb);
          if (
            parsed.date === todayStr &&
            typeof parsed.facilities === "object"
          ) {
            facilities = parsed.facilities;
          }
        }
        facilities[facility] = true;
        localStorage.setItem(
          "checkin_facility_feedback",
          JSON.stringify({ date: todayStr, facilities })
        );
      } catch {
        /* ignore */
      }

      const label = FACILITY_LABELS[facility] || "สนามกีฬา";
      setOk(`บันทึกแบบประเมินสนาม${label}เรียบร้อย ขอบคุณสำหรับข้อมูล :)`);
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

  const facilityLabel = FACILITY_LABELS[facility] || "สนามกีฬา";

  return (
    <div data-page="checkin-feedback" className="wrap">
      <HeaderUser displayName={displayName} BACKEND={BACKEND} />
      <main>
        <section className="fb-card" aria-label="แบบประเมินปัญหาประจำวัน">
          {/* หัวข้อ */}
          <header className="fb-header">
            <h1>
              แบบประเมินปัญหาการใช้งาน{facilityLabel} (รายวัน)
            </h1>
            <p className="fb-subtitle">
              โปรดบันทึกปัญหาและข้อเสนอแนะหลังจากเช็คอินครบสำหรับ
              {" "}
              {facilityLabel}
              {" "}
              ในวันนี้
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
              * แบบประเมินนี้ใช้สำหรับเก็บข้อมูลปัญหาของ
              {" "}
              {facilityLabel}
              {" "}
              ในแต่ละวัน และช่วยปรับปรุงการให้บริการสนามกีฬา
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
