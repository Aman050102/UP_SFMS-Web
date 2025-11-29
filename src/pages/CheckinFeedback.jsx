// src/pages/CheckinFeedback.tsx
import React, { useEffect, useState } from "react";
import HeaderUser from "../components/HeaderUser";
import "../styles/checkin_feedback.css";

const BACKEND = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

function getCookie(name: string) {
  const v = `; ${document.cookie}`;
  const p = v.split(`; ${name}=`);
  return p.length === 2 ? p.pop()!.split(";").shift() : null;
}

declare global {
  interface Window {
    CURRENT_USER?: string;
  }
}

export default function CheckinFeedback() {
  const [displayName, setDisplayName] = useState("กำลังโหลด...");
  const [dateLabel, setDateLabel] = useState("");
  const [problems, setProblems] = useState("");
  const [details, setDetails] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [improvements, setImprovements] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  // 1) ตรวจว่ากรอกสนามกลางแจ้งครบทุกชนิดของ "วันนี้" แล้วหรือยัง
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const doneDate = localStorage.getItem("checkin_outdoor_done_date");

    if (doneDate !== today) {
      alert(
        "ไม่สามารถทำแบบประเมินได้\nกรุณาเช็คอินสนามกลางแจ้งให้ครบทุกประเภทของวันนี้ก่อน"
      );
      window.location.href = "/checkin";
      return;
    }
  }, []);

  // 2) ตั้งค่าป้ายวันที่ (ไทย + พ.ศ.)
  useEffect(() => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("th-TH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).formatToParts(now);
    const thaiYear = now.getFullYear() + 543;
    const label = parts
      .map((p) => (p.type === "year" ? String(thaiYear) : p.value))
      .join("");
    setDateLabel(label);
  }, []);

  // 3) โหลดชื่อผู้ใช้จาก backend
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND}/auth/me/`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.ok && data?.username) {
            setDisplayName(data.username);
            localStorage.setItem("display_name", data.username);
            return;
          }
        }
      } catch {
        // ถ้า error จะไปใช้ค่าจาก localStorage/ window แทน
      }
      const fromLocal =
        localStorage.getItem("display_name") || window.CURRENT_USER || "ผู้ใช้งาน";
      setDisplayName(fromLocal);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOkMsg("");
    setErrMsg("");

    if (!problems && !details && !suggestions && !improvements && !file) {
      setErrMsg("กรุณากรอกข้อมูลอย่างน้อย 1 ช่อง หรือแนบไฟล์ประกอบ");
      return;
    }

    try {
      setSubmitting(true);

      const csrftoken = getCookie("csrftoken") || "";
      const formData = new FormData();
      formData.append("problems", problems);
      formData.append("details", details);
      formData.append("suggestions", suggestions);
      formData.append("improvements", improvements);
      if (file) {
        formData.append("register_file", file);
      }

      const res = await fetch(`${BACKEND}/api/checkin/feedback/`, {
        method: "POST",
        credentials: "include",
        headers: csrftoken ? { "X-CSRFToken": csrftoken } : undefined,
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "ส่งแบบประเมินไม่สำเร็จ");
      }

      setOkMsg("ส่งแบบประเมินเรียบร้อยแล้ว ขอบคุณสำหรับข้อมูล 😊");
      setProblems("");
      setDetails("");
      setSuggestions("");
      setImprovements("");
      setFile(null);
    } catch (err: any) {
      setErrMsg(err?.message || "ส่งแบบประเมินไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
  }

  return (
    <div className="wrap" data-page="checkin-feedback">
      <HeaderUser displayName={displayName} BACKEND={BACKEND} />

      <main>
        <section className="card fb-card">
          <header className="fb-header">
            <h1>แบบประเมินหลังการเช็คอินสนามกีฬา</h1>
            <p className="fb-subtitle">
              ช่วยบันทึกปัญหาและข้อเสนอแนะ เพื่อใช้ปรับปรุงการบริหารจัดการสนามกีฬาให้ดียิ่งขึ้น
            </p>
          </header>

          {/* ข้อมูลพื้นฐาน (ออโต้) */}
          <section className="fb-basic">
            <div className="fb-basic-row">
              <div>
                <span className="fb-label">วันที่</span>
                <div className="fb-value">{dateLabel || "-"}</div>
              </div>
              <div>
                <span className="fb-label">ผู้บันทึก</span>
                <div className="fb-value">{displayName}</div>
              </div>
            </div>
            <div className="fb-note">
              ข้อมูลพื้นฐานด้านบนจะแสดงอัตโนมัติตามวันที่และผู้ใช้งานที่เข้าสู่ระบบ
            </div>
          </section>

          <form className="fb-form" onSubmit={onSubmit}>
            {/* ปัญหาที่พบวันนี้ */}
            <div className="fb-field">
              <label className="fb-label" htmlFor="problems">
                ปัญหาที่พบวันนี้
              </label>
              <textarea
                id="problems"
                className="fb-textarea"
                placeholder="เช่น ลูกบาสเกตบอลชำรุด สนามลื่น ไฟส่องสว่างไม่เพียงพอ ฯลฯ"
                value={problems}
                onChange={(e) => setProblems(e.target.value)}
              />
            </div>

            {/* รายละเอียดปัญหา */}
            <div className="fb-field">
              <label className="fb-label" htmlFor="details">
                รายละเอียดปัญหา
              </label>
              <textarea
                id="details"
                className="fb-textarea"
                placeholder="อธิบายเพิ่มเติม เช่น เกิดขึ้นช่วงเวลาใด ณ สนามใด ส่งผลกระทบอย่างไรต่อการใช้งาน"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            {/* ข้อเสนอแนะ */}
            <div className="fb-field">
              <label className="fb-label" htmlFor="suggestions">
                ข้อเสนอแนะ
              </label>
              <textarea
                id="suggestions"
                className="fb-textarea"
                placeholder="เช่น เพิ่มไฟส่องสว่าง ปรับปรุงพื้นสนาม เปลี่ยนลูกบอล ฯลฯ"
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
              />
            </div>

            {/* สิ่งที่อยากให้ปรับปรุง */}
            <div className="fb-field">
              <label className="fb-label" htmlFor="improvements">
                สิ่งที่อยากให้ปรับปรุงเพิ่มเติม
              </label>
              <textarea
                id="improvements"
                className="fb-textarea"
                placeholder="เช่น ระบบจองสนาม การสื่อสารกับผู้ใช้งาน กติกาการใช้งาน ฯลฯ"
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
              />
            </div>

            {/* แนบไฟล์ */}
            <div className="fb-field">
              <label className="fb-label" htmlFor="register_file">
                แนบไฟล์รูปใบลงทะเบียนวันนี้
              </label>
              <p className="fb-help">
                สามารถถ่ายรูปกระดาษลงทะเบียน หรือแนบไฟล์รูปภาพ/เอกสารที่เกี่ยวข้อง
                เพื่อใช้เป็นหลักฐานอ้างอิง
              </p>
              <div className="fb-file-box">
                <input
                  id="register_file"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={onFileChange}
                />
                {file && (
                  <div className="fb-file-name">
                    ไฟล์ที่เลือก: <strong>{file.name}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* ข้อความแจ้งสถานะ */}
            {errMsg && <p className="fb-error">{errMsg}</p>}
            {okMsg && <p className="fb-ok">{okMsg}</p>}

            {/* ปุ่มส่ง */}
            <div className="fb-actions">
              <button className="fb-btn-primary" type="submit" disabled={submitting}>
                {submitting ? "กำลังส่งแบบประเมิน..." : "ส่งแบบประเมิน"}
              </button>
              <button
                className="fb-btn-ghost"
                type="button"
                onClick={() => (window.location.href = "/checkin")}
              >
                กลับไปหน้าบันทึกเช็คอิน
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
