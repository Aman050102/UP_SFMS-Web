import React, { useEffect, useRef, useState } from "react";
import HeaderUser from "../components/HeaderUser";
import "../styles/checkin.css";

// ปุ่มชั้นบน / ชนิดสนาม
const TOP = [
  { k: "outdoor",   name: "สนามกลางแจ้ง", isOutdoor: true },
  { k: "badminton", name: "สนามแบดมินตัน" },
  { k: "track",     name: "สนามลู่-ลาน" },
  { k: "pool",      name: "สระว่ายน้ำ" },
]; // <- ไม่มี as const

const OUTDOOR_SUBS = [
  { k: "tennis",        name: "เทนนิส" },
  { k: "basketball",    name: "บาสเกตบอล" },
  { k: "futsal",        name: "ฟุตซอล" },
  { k: "football",      name: "ฟุตบอล" },
  { k: "volleyball",    name: "วอลเลย์บอล" },
  { k: "sepak_takraw",  name: "เซปักตะกร้อ" },
  { k: "badminton",     name: "แบดมินตัน" },
];

const SINGLE_FACILITY_NAMES = {
  badminton: "สนามแบดมินตัน",
  track: "สนามลู่-ลาน",
  pool: "สระว่ายน้ำ",
};

function getCookie(name) {
  const v = `; ${document.cookie}`;
  const p = v.split(`; ${name}=`);
  return p.length === 2 ? p.pop().split(";").shift() : null;
}

export default function CheckinPage() {
  const BACKEND = "http://localhost:8000";
  const [currentFacility, setCurrentFacility] = useState(null); // 'outdoor' | 'badminton' | 'track' | 'pool'
  const [selectedSub, setSelectedSub] = useState(null); // {k,name} เฉพาะกลางแจ้ง
  const [students, setStudents] = useState("");
  const [staff, setStaff] = useState("");
  const [error, setError] = useState("");

  // header
  const displayName = (window.CURRENT_USER) || "ผู้ใช้งาน";

  // ป้ายวันที่ (ไทย + พ.ศ.)
  useEffect(() => {
    const el = document.getElementById("todayDate");
    if (!el) return;
    const render = () => {
      const now = new Date();
      const parts = new Intl.DateTimeFormat("th-TH", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      }).formatToParts(now);
      const thaiYear = now.getFullYear() + 543;
      el.textContent = parts.map((p) => (p.type === "year" ? thaiYear : p.value)).join("");
    };
    render();
    const t = setInterval(render, 60000);
    return () => clearInterval(t);
  }, []);

  function onTopClick(f) {
    setCurrentFacility(f.k);
    setSelectedSub(null);
    setStudents("");
    setStaff("");
    setError("");
  }

  const okCounts = Number.isInteger(Number(students)) && Number(students) >= 0
                 && Number.isInteger(Number(staff))    && Number(staff)    >= 0
                 && students !== "" && staff !== "";

  const canSubmit = currentFacility === "outdoor"
    ? okCounts && !!selectedSub
    : okCounts && !!currentFacility;

  async function doCheckin() {
    if (!canSubmit) return;
    setError("");
    const csrftoken = getCookie("csrftoken") || "";

    const body = {
      facility: currentFacility,
      outdoor_sub: currentFacility === "outdoor" ? (selectedSub?.k || "") : "",
      count: Number(students) + Number(staff),
      note: "",
    };

    try {
      const res = await fetch(`${BACKEND}/api/checkin/event/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(csrftoken ? { "X-CSRFToken": csrftoken } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      // success overlay
      const ov = document.getElementById("overlay");
      if (ov) {
        ov.classList.add("show");
        setTimeout(() => ov.classList.remove("show"), 900);
      }
      setStudents("");
      setStaff("");
    } catch (e) {
      setError(e.message || "บันทึกไม่สำเร็จ");
    }
  }

  return (
    <div className="wrap" data-page="checkin">
      <HeaderUser displayName={displayName} BACKEND={BACKEND} />
      <main>
        <span id="todayDate" className="date-badge" aria-live="polite" />

        {/* ชั้นที่ 1 */}
        {!currentFacility && (
          <section className="card" id="panel-top">
            <h3 className="h3">เลือกประเภทสนาม</h3>
            <div className="grid" id="grid-top">
              {TOP.map((f) => (
                <button key={f.k} className="btn" type="button" onClick={() => onTopClick(f)}>
                  {f.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ชั้นที่ 2 */}
        {currentFacility && (
          <section className="card" id="panel-outdoor">
            <div className="toolbar">
              <button className="btn" type="button" id="btnBack"
                onClick={() => { setCurrentFacility(null); setSelectedSub(null); setError(""); }}>
                &larr; กลับ
              </button>
              <span className="hint">เลือกชนิดสนามหรือกรอกจำนวนผู้ใช้</span>
            </div>

            {/* ชื่อสนาม */}
            <h2 id="facilityTitle" className="chip-title" style={{display: (currentFacility==="outdoor" && !selectedSub) ? "none":"inline-block"}}>
              {currentFacility==="outdoor" ? (selectedSub?.name || "") : (SINGLE_FACILITY_NAMES[currentFacility] || "")}
            </h2>

            {/* ปุ่มสนามย่อย (เฉพาะกลางแจ้ง) */}
            {currentFacility === "outdoor" && (
              <div className="grid" id="grid-outdoor">
                {OUTDOOR_SUBS.map((s) => (
                  <button
                    key={s.k}
                    className={`btn sport-btn ${selectedSub?.k === s.k ? "active" : ""}`}
                    type="button"
                    onClick={() => setSelectedSub(s)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            {/* error */}
            {error && (
              <p id="formError" className="hint" style={{color:"#c0392b"}}>{error}</p>
            )}

            {/* ฟอร์มจำนวน */}
            <div className="form-card form-center">
              <div className="row">
                <label htmlFor="students">จำนวนนิสิต</label>
                <input id="students" className="input-lg" type="number" min="0" step="1"
                  value={students} onChange={(e)=>setStudents(e.target.value)} placeholder="จำนวนคน" />
              </div>
              <div className="row">
                <label htmlFor="staff">จำนวนบุคลากร</label>
                <input id="staff" className="input-lg" type="number" min="0" step="1"
                  value={staff} onChange={(e)=>setStaff(e.target.value)} placeholder="จำนวนคน" />
              </div>
            </div>

            <div className="action-wrap">
              <button id="submitBtn" className="btn btn-primary" disabled={!canSubmit} onClick={doCheckin}>
                ตกลง
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Overlay success */}
      <div id="overlay" className="overlay" aria-live="polite">
        <div className="card-ok">
          <p className="ok-title">เช็คอิน<br />เสร็จสิ้น</p>
          <div className="ok-icon">✔️</div>
        </div>
      </div>
    </div>
  );
}