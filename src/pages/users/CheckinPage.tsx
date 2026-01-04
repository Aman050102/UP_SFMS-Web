import React, { useEffect, useState } from "react";
import "../../styles/checkin.css";

const TOP = [
  { k: "outdoor", name: "สนามกลางแจ้ง", isOutdoor: true },
  { k: "badminton", name: "สนามแบดมินตัน" },
  { k: "track", name: "สนามลู่-ลาน" },
  { k: "pool", name: "สระว่ายน้ำ" },
];

const OUTDOOR_SUBS = [
  { k: "tennis", name: "เทนนิส" },
  { k: "basketball", name: "บาสเกตบอล" },
  { k: "futsal", name: "ฟุตซอล" },
  { k: "football", name: "ฟุตบอล" },
  { k: "volleyball", name: "วอลเลย์บอล" },
  { k: "sepak_takraw", name: "เซปักตะกร้อ" },
  { k: "badminton", name: "แบดมินตัน" },
];

const OUTDOOR_KEYS = OUTDOOR_SUBS.map(s => `outdoor:${s.k}`);

const FACILITY_LABELS = {
  outdoor: "สนามกลางแจ้ง",
  badminton: "สนามแบดมินตัน",
  track: "สนามลู่-ลาน",
  pool: "สระว่ายน้ำ",
};

const FACILITY_KEYS = ["outdoor", "badminton", "track", "pool"];

function getCookie(name) {
  const v = `; ${document.cookie}`;
  const p = v.split(`; ${name}=`);
  return p.length === 2 ? p.pop().split(";").shift() : null;
}

export default function CheckinPage() {
  const BACKEND = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
  const [currentFacility, setCurrentFacility] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [students, setStudents] = useState("");
  const [staff, setStaff] = useState("");
  const [error, setError] = useState("");
  const [doneMap, setDoneMap] = useState({});
  const [facilityDone, setFacilityDone] = useState({});
  const [facilityFeedback, setFacilityFeedback] = useState({});

  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("checkin_progress");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === todayStr) setDoneMap(parsed.done || {});
      }
      const rawDone = localStorage.getItem("checkin_facility_done");
      if (rawDone) {
        const parsed = JSON.parse(rawDone);
        if (parsed.date === todayStr) setFacilityDone(parsed.facilities || {});
      }
      const rawFb = localStorage.getItem("checkin_facility_feedback");
      if (rawFb) {
        const parsed = JSON.parse(rawFb);
        if (parsed.date === todayStr) setFacilityFeedback(parsed.facilities || {});
      }
    } catch (e) { console.error(e); }
  }, [todayStr]);

  async function doCheckin() {
    let key = currentFacility === "outdoor" ? `outdoor:${selectedSub?.k}` : currentFacility;
    if (doneMap[key]) { setError("วันนี้บันทึกไปแล้ว"); return; }

    const body = {
      facility: currentFacility,
      outdoor_sub: currentFacility === "outdoor" ? selectedSub?.k : "",
      count: Number(students) + Number(staff),
      note: "",
    };

    try {
      const res = await fetch(`${BACKEND}/api/checkin/event/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") || "" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");

      const nextDone = { ...doneMap, [key]: true };
      setDoneMap(nextDone);
      localStorage.setItem("checkin_progress", JSON.stringify({ date: todayStr, done: nextDone }));

      const ov = document.getElementById("overlay");
      ov?.classList.add("show");
      setTimeout(() => {
        ov?.classList.remove("show");
        window.location.reload();
      }, 800);
    } catch (e) { setError(e.message); }
  }

  const facilitiesNeedFeedback = FACILITY_KEYS.filter(fac => facilityDone[fac] && !facilityFeedback[fac]);

  return (
    <div className="wrap" data-page="checkin">
      <main>
        {facilitiesNeedFeedback.length > 0 && (
          <div className="feedback-alert">
            <span>เช็คอิน {FACILITY_LABELS[facilitiesNeedFeedback[0]]} ครบแล้ว กรุณาทำแบบประเมิน</span>
            <button onClick={() => window.location.href = `/checkin_feedback?facility=${facilitiesNeedFeedback[0]}`}>ไปทำแบบประเมิน</button>
          </div>
        )}

        {!currentFacility ? (
          <section className="card">
            <h3>เลือกประเภทสนาม</h3>
            <div className="grid-top">
              {TOP.map(f => (
                <button key={f.k} className="btn" onClick={() => setCurrentFacility(f.k)}>{f.name}</button>
              ))}
            </div>
          </section>
        ) : (
          <section className="card">
            <button className="btn" onClick={() => setCurrentFacility(null)}>&larr; กลับ</button>
            <div className="form-card">
              <div className="row">
                <label>จำนวนนิสิต</label>
                <input className="input-lg" type="number" value={students} onChange={e => setStudents(e.target.value)} />
              </div>
              <div className="row">
                <label>จำนวนบุคลากร</label>
                <input className="input-lg" type="number" value={staff} onChange={e => setStaff(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-primary" onClick={doCheckin}>ตกลง</button>
            {error && <p style={{color:'red'}}>{error}</p>}
          </section>
        )}
      </main>
      <div id="overlay" className="overlay"><div className="card-ok">เสร็จสิ้น ✔</div></div>
    </div>
  );
}
