import React, { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Users, UserRound } from "lucide-react";
import "../../styles/checkin.css";

const TOP = [
  { k: "outdoor", name: "สนามกลางแจ้ง", icon: "🏸" },
  { k: "badminton", name: "สนามแบดมินตัน", icon: "🏸" },
  { k: "track", name: "สนามลู่-ลาน", icon: "🏃" },
  { k: "pool", name: "สระว่ายน้ำ", icon: "🏊" },
];

const OUTDOOR_SUBS = [
  { k: "tennis", name: "เทนนิส" },
  { k: "basketball", name: "บาสเกตบอล" },
  { k: "futsal", name: "ฟุตซอล" },
  { k: "football", name: "ฟุตบอล" },
  { k: "volleyball", name: "วอลเลย์บอล" },
  { k: "sepak_takraw", name: "เซปักตะกร้อ" },
];

const FACILITY_LABELS = {
  outdoor: "สนามกลางแจ้ง",
  badminton: "สนามแบดมินตัน",
  track: "สนามลู่-ลาน",
  pool: "สระว่ายน้ำ",
};

export default function CheckinPage() {
  const BACKEND = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8787").replace(/\/$/, "");
  const [currentFacility, setCurrentFacility] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [students, setStudents] = useState("");
  const [staff, setStaff] = useState("");
  const [error, setError] = useState("");
  const [doneMap, setDoneMap] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  const isoDate = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const raw = localStorage.getItem("checkin_progress");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === isoDate) setDoneMap(parsed.done || {});
    }
  }, [isoDate]);

  async function doCheckin() {
    if (!students && !staff) { setError("กรุณาระบุจำนวนผู้เข้าใช้"); return; }

    const key = currentFacility === "outdoor" ? `outdoor:${selectedSub?.k}` : currentFacility;
    if (doneMap[key]) { setError("วันนี้บันทึกสนามนี้ไปแล้ว"); return; }

    setIsSubmitting(true);
    const body = {
      facility: currentFacility,
      sub_facility: currentFacility === "outdoor" ? selectedSub?.name : "",
      students: Number(students) || 0,
      staff: Number(staff) || 0,
      action: 'in'
    };

    try {
      const res = await fetch(`${BACKEND}/api/checkin/event/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");

      const nextDone = { ...doneMap, [key]: true };
      setDoneMap(nextDone);
      localStorage.setItem("checkin_progress", JSON.stringify({ date: isoDate, done: nextDone }));

      document.getElementById("overlay")?.classList.add("show");
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
        setError(e.message);
        setIsSubmitting(false);
    }
  }

  return (
    <div className="wrap" data-page="checkin">
      <main>
        <div className="header-section">
            <h1 className="main-title">บันทึกการใช้สนาม</h1>
            <div className="date-badge">{todayStr}</div>
        </div>
        
        {!currentFacility ? (
          <section className="card">
            <h3 className="section-label">เลือกประเภทสนาม</h3>
            <div className="grid-top">
              {TOP.map(f => (
                <button key={f.k} className="facility-btn" onClick={() => setCurrentFacility(f.k)}>
                  <span className="icon">{f.icon}</span>
                  <span className="name">{f.name}</span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="card active-card">
            <button
  type="button"
  className="back-btn"
  onClick={() => {
    setCurrentFacility(null);
    setSelectedSub(null);
    setError("");
  }}
>
  <ArrowLeft size={18} strokeWidth={2.5} />
  <span>กลับไปหน้าเลือกสนาม</span>
</button>

            {currentFacility === "outdoor" && !selectedSub ? (
              <div className="sub-facility-section">
                <h3 className="section-label">ระบุสนามกลางแจ้งย่อย</h3>
                <div className="grid-outdoor">
                  {OUTDOOR_SUBS.map(s => (
                    <button key={s.k}
                        className={`sport-btn ${doneMap[`outdoor:${s.k}`] ? 'is-done' : ''}`}
                        onClick={() => setSelectedSub(s)}
                        disabled={doneMap[`outdoor:${s.k}`]}>
                      {s.name} {doneMap[`outdoor:${s.k}`] && <span className="done-check">✔</span>}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="checkin-form">
                <div className="form-header">
                  <h2 className="facility-name">
                    {FACILITY_LABELS[currentFacility as keyof typeof FACILITY_LABELS]}
                    {selectedSub && <span className="sub-name"> / {selectedSub.name}</span>}
                  </h2>
                </div>

                <div className="form-inputs">
                  <div className="input-group">
                    <label><UserRound size={16} /> จำนวนนิสิต (คน)</label>
                    <input className="input-lg" type="number" placeholder="0" value={students} onChange={e => setStudents(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label><Users size={16} /> จำนวนบุคลากร (คน)</label>
                    <input className="input-lg" type="number" placeholder="0" value={staff} onChange={e => setStaff(e.target.value)} />
                  </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button className="btn-submit" onClick={doCheckin} disabled={isSubmitting}>
                  {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการบันทึก"}
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      <div id="overlay" className="overlay">
        <div className="card-ok">
          <div className="success-icon"><CheckCircle2 size={64} color="#22c55e" /></div>
          <h2 className="ok-title">บันทึกเรียบร้อย</h2>
          <p className="ok-hint">ข้อมูลผู้เข้าใช้งานสนามถูกจัดเก็บในระบบแล้ว</p>
        </div>
      </div>
    </div>
  );
}
