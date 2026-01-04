
// src/pages/CheckinPage.jsx
import React, { useEffect, useState } from "react";
import HeaderUser from "../../components/HeaderUser";
import "../../styles/checkin.css";

// ปุ่มชั้นบน / ชนิดสนาม
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

// key ย่อยของกลางแจ้ง
const OUTDOOR_KEYS = [
  "outdoor:tennis",
  "outdoor:basketball",
  "outdoor:futsal",
  "outdoor:football",
  "outdoor:volleyball",
  "outdoor:sepak_takraw",
  "outdoor:badminton",
];

// ชื่อสนามเดี่ยว
const SINGLE_FACILITY_NAMES = {
  badminton: "สนามแบดมินตัน",
  track: "สนามลู่-ลาน",
  pool: "สระว่ายน้ำ",
};

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
  const BACKEND = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
  ).replace(/\/$/, "");

  const [currentFacility, setCurrentFacility] = useState(null); // 'outdoor' | 'badminton' | 'track' | 'pool'
  const [selectedSub, setSelectedSub] = useState(null); // {k,name} เฉพาะกลางแจ้ง
  const [students, setStudents] = useState("");
  const [staff, setStaff] = useState("");
  const [error, setError] = useState("");

  // progress ว่าตัวไหนเช็คอินแล้วของวันนี้ เช่น { "outdoor:tennis": true, "badminton": true, ... }
  const [doneMap, setDoneMap] = useState({});

  // สถานะว่าแต่ละ "ประเภทสนาม" เช็คอินครบแล้วหรือยัง (ใช้แสดง banner / ตรวจสิทธิ์ประเมิน)
  const [facilityDone, setFacilityDone] = useState({});
  // สถานะว่าแต่ละประเภททำแบบประเมินแล้วหรือยัง
  const [facilityFeedback, setFacilityFeedback] = useState({});

  const displayName =
    window.CURRENT_USER || localStorage.getItem("display_name") || "ผู้ใช้งาน";

  const todayStr = new Date().toISOString().slice(0, 10);

  // โหลด progress ย่อยของแต่ละสนามจาก localStorage (ต่อวัน)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("checkin_progress");
      if (!raw) {
        setDoneMap({});
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.date !== todayStr || typeof parsed.done !== "object") {
        setDoneMap({});
        return;
      }
      setDoneMap(parsed.done || {});
    } catch {
      setDoneMap({});
    }
  }, [todayStr]);

  // โหลดสถานะ "เช็คอินครบต่อประเภทสนาม" + "ทำแบบประเมินแล้ว" ในวันนี้
  useEffect(() => {
    // done
    try {
      const rawDone = localStorage.getItem("checkin_facility_done");
      if (rawDone) {
        const parsed = JSON.parse(rawDone);
        if (parsed.date === todayStr && typeof parsed.facilities === "object") {
          setFacilityDone(parsed.facilities);
        } else {
          setFacilityDone({});
        }
      } else {
        setFacilityDone({});
      }
    } catch {
      setFacilityDone({});
    }

    // feedback
    try {
      const rawFb = localStorage.getItem("checkin_facility_feedback");
      if (rawFb) {
        const parsed = JSON.parse(rawFb);
        if (parsed.date === todayStr && typeof parsed.facilities === "object") {
          setFacilityFeedback(parsed.facilities);
        } else {
          setFacilityFeedback({});
        }
      } else {
        setFacilityFeedback({});
      }
    } catch {
      setFacilityFeedback({});
    }
  }, [todayStr]);

  // ป้ายวันที่ (ไทย + พ.ศ.)
  useEffect(() => {
    const el = document.getElementById("todayDate");
    if (!el) return;
    const render = () => {
      const now = new Date();
      const parts = new Intl.DateTimeFormat("th-TH", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).formatToParts(now);
      const thaiYear = now.getFullYear() + 543;
      el.textContent = parts
        .map((p) => (p.type === "year" ? String(thaiYear) : p.value))
        .join("");
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

  const okCounts =
    Number.isInteger(Number(students)) &&
    Number(students) >= 0 &&
    Number.isInteger(Number(staff)) &&
    Number(staff) >= 0 &&
    students !== "" &&
    staff !== "";

  const canSubmit =
    currentFacility === "outdoor"
      ? okCounts && !!selectedSub
      : okCounts && !!currentFacility;

  // outdoor เช็คครบหรือยัง
  function isOutdoorDone(map) {
    return OUTDOOR_KEYS.every((k) => map[k]);
  }

  async function doCheckin() {
    if (!canSubmit) return;
    setError("");

    // key ย่อยของสนามนี้ (ใช้ป้องกันกรอกซ้ำ)
    let key = null;
    if (currentFacility === "outdoor" && selectedSub && selectedSub.k) {
      key = `outdoor:${selectedSub.k}`;
    } else if (currentFacility) {
      key = currentFacility; // badminton / track / pool
    }

    if (key && doneMap[key]) {
      setError("วันนี้มีการบันทึกข้อมูลของสนามนี้ไปแล้ว");
      return; // ห้ามส่งซ้ำ
    }

    const csrftoken = getCookie("csrftoken") || "";

    const body = {
      facility: currentFacility,
      outdoor_sub:
        currentFacility === "outdoor"
          ? selectedSub
            ? selectedSub.k
            : ""
          : "",
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "บันทึกไม่สำเร็จ");
      }

      // === อัปเดต progress ย่อยของวันนี้ ===
      let completedFacility = null;
      if (key) {
        const nextDone = {
          ...doneMap,
          [key]: true,
        };
        setDoneMap(nextDone);

        // เก็บ progress ต่อวัน (ทุกสนามย่อย)
        localStorage.setItem(
          "checkin_progress",
          JSON.stringify({ date: todayStr, done: nextDone })
        );

        // ถ้ากลางแจ้ง → ถือว่า "ประเภทสนามกลางแจ้ง" เสร็จเมื่อครบทุกสนามย่อย
        if (currentFacility === "outdoor" && isOutdoorDone(nextDone)) {
          completedFacility = "outdoor";
        }
        // สนามเดี่ยว → ทำครั้งเดียวก็ถือว่าเสร็จ
        if (currentFacility !== "outdoor") {
          completedFacility = currentFacility;
        }
      }

      // ถ้าประเภทสนามใด "เช็คอินครบแล้ว" → เก็บลง localStorage สำหรับใช้เช็คสิทธิ์แบบประเมิน
      if (completedFacility) {
        let facilities = {};
        try {
          const rawDone = localStorage.getItem("checkin_facility_done");
          if (rawDone) {
            const parsed = JSON.parse(rawDone);
            if (
              parsed.date === todayStr &&
              typeof parsed.facilities === "object"
            ) {
              facilities = parsed.facilities;
            }
          }
        } catch {
          /* ignore */
        }
        facilities[completedFacility] = true;
        localStorage.setItem(
          "checkin_facility_done",
          JSON.stringify({ date: todayStr, facilities })
        );
        setFacilityDone(facilities);
      }

      // overlay success
      const ov = document.getElementById("overlay");
      if (ov) {
        ov.classList.add("show");
      }

      setStudents("");
      setStaff("");

      setTimeout(() => {
        if (ov) ov.classList.remove("show");

        // ถ้าสนามประเภทนี้เช็คอินครบแล้ว → ถามว่าจะไปหน้าแบบประเมินเลยไหม
        if (completedFacility) {
          const label = FACILITY_LABELS[completedFacility] || "สนามนี้";
          const go = window.confirm(
            `วันนี้เช็คอินครบสำหรับ${label}แล้ว\nต้องการไปหน้าแบบประเมินของสนามนี้เลยหรือไม่?`
          );
          if (go) {
            window.location.href = `/checkin_feedback?facility=${completedFacility}`;
          }
        }
      }, 900);
    } catch (e) {
      setError(e && e.message ? e.message : "บันทึกไม่สำเร็จ");
    }
  }

  // รายการประเภทสนามที่ "เช็คอินครบแล้วแต่ยังไม่ทำแบบประเมิน"
  const facilitiesNeedFeedback = FACILITY_KEYS.filter(
    (fac) => facilityDone[fac] && !facilityFeedback[fac]
  );

  return (
    <div className="wrap" data-page="checkin">
      <HeaderUser displayName={displayName} BACKEND={BACKEND} />
      <main>
        <span id="todayDate" className="date-badge" aria-live="polite" />

        {/* banner nag ให้ไปทำแบบประเมิน ถ้าเช็คอินครบแล้วแต่ยังไม่ส่ง */}
        {facilitiesNeedFeedback.length > 0 && (
          <div className="feedback-alert" role="status">
            <span>
              วันนี้เช็คอินครบสำหรับ
              {" "}
              {facilitiesNeedFeedback.length === 1
                ? FACILITY_LABELS[facilitiesNeedFeedback[0]]
                : "หลายประเภทสนาม"}
              {" "}
              แล้ว แต่ยังไม่ได้ทำแบบประเมิน
            </span>
            <button
              type="button"
              className="feedback-alert-btn"
              onClick={() =>
                window.location.href = `/checkin_feedback?facility=${facilitiesNeedFeedback[0]}`
              }
            >
              ไปทำแบบประเมิน
            </button>
          </div>
        )}

        {/* ชั้นที่ 1 : เลือกประเภทสนาม */}
        {!currentFacility && (
          <section className="card" id="panel-top">
            <h3 className="h3">เลือกประเภทสนาม</h3>
            <p className="hint top-hint">
              เลือกประเภทสนามที่ต้องการเช็คอินก่อน จากนั้นกรอกจำนวนผู้ใช้ในแต่ละสนาม
            </p>
            <div className="grid-top" id="grid-top">
              {TOP.map((f) => (
                <button
                  key={f.k}
                  className="btn"
                  type="button"
                  onClick={() => onTopClick(f)}
                >
                  {FACILITY_LABELS[f.k] || f.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ชั้นที่ 2 : เลือกสนามย่อย (ถ้ามี) + กรอกจำนวนคน */}
        {currentFacility && (
          <section className="card" id="panel-outdoor">
            <div className="toolbar">
              <button
                className="btn"
                type="button"
                id="btnBack"
                onClick={() => {
                  setCurrentFacility(null);
                  setSelectedSub(null);
                  setError("");
                }}
              >
                &larr; กลับ
              </button>
              <span className="hint">
                เลือกชนิดสนามหรือกรอกจำนวนผู้ใช้ จากนั้นกด “ตกลง”
              </span>
            </div>

            {/* ชื่อสนาม */}
            <h2
              id="facilityTitle"
              className="chip-title"
              style={{
                display:
                  currentFacility === "outdoor" && !selectedSub
                    ? "none"
                    : "inline-block",
              }}
            >
              {currentFacility === "outdoor"
                ? (selectedSub && selectedSub.name) || ""
                : SINGLE_FACILITY_NAMES[currentFacility] || ""}
            </h2>

            {/* ปุ่มสนามย่อย (เฉพาะกลางแจ้ง) */}
            {currentFacility === "outdoor" && (
              <div className="grid-outdoor" id="grid-outdoor">
                {OUTDOOR_SUBS.map((s) => {
                  const key = `outdoor:${s.k}`;
                  const isDone = !!doneMap[key];
                  return (
                    <button
                      key={s.k}
                      className={
                        "btn sport-btn " +
                        (selectedSub && selectedSub.k === s.k ? "active" : "")
                      }
                      type="button"
                      onClick={() => setSelectedSub(s)}
                    >
                      <span>{s.name}</span>
                      {isDone && (
                        <span className="sport-done">✔ บันทึกแล้ว</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* error */}
            {error && (
              <p
                id="formError"
                className="hint"
                style={{ color: "#c0392b", marginTop: 8 }}
              >
                {error}
              </p>
            )}

            {/* ฟอร์มจำนวน */}
            <div className="form-card form-center">
              <div className="row">
                <label htmlFor="students">จำนวนนิสิต</label>
                <input
                  id="students"
                  className="input-lg"
                  type="number"
                  min="0"
                  step="1"
                  value={students}
                  onChange={(e) => setStudents(e.target.value)}
                  placeholder="จำนวนคน"
                />
              </div>
              <div className="row">
                <label htmlFor="staff">จำนวนบุคลากร</label>
                <input
                  id="staff"
                  className="input-lg"
                  type="number"
                  min="0"
                  step="1"
                  value={staff}
                  onChange={(e) => setStaff(e.target.value)}
                  placeholder="จำนวนคน"
                />
              </div>
            </div>

            <div className="action-wrap">
              <button
                id="submitBtn"
                className="btn btn-primary"
                disabled={!canSubmit}
                onClick={doCheckin}
              >
                ตกลง
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Overlay success */}
      <div id="overlay" className="overlay" aria-live="polite">
        <div className="card-ok">
          <p className="ok-title">
            เช็คอิน
            <br />
            เสร็จสิ้น
          </p>
          <div className="ok-icon">✔️</div>
        </div>
      </div>
    </div>
  );
}
