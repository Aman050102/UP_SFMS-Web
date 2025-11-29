// src/pages/CheckinPage.tsx
import React, { useEffect, useState } from "react";
import HeaderUser from "../components/HeaderUser";
import "../styles/checkin.css";

// ปุ่มชั้นบน / ชนิดสนาม
const TOP = [
  { k: "outdoor",   name: "สนามกลางแจ้ง", isOutdoor: true },
  { k: "badminton", name: "สนามแบดมินตัน" },
  { k: "track",     name: "สนามลู่-ลาน" },
  { k: "pool",      name: "สระว่ายน้ำ" },
];

const OUTDOOR_SUBS = [
  { k: "tennis",        name: "เทนนิส" },
  { k: "basketball",    name: "บาสเกตบอล" },
  { k: "futsal",        name: "ฟุตซอล" },
  { k: "football",      name: "ฟุตบอล" },
  { k: "volleyball",    name: "วอลเลย์บอล" },
  { k: "sepak_takraw",  name: "เซปักตะกร้อ" },
  { k: "badminton",     name: "แบดมินตัน" },
];

const SINGLE_FACILITY_NAMES: Record<string, string> = {
  badminton: "สนามแบดมินตัน",
  track: "สนามลู่-ลาน",
  pool: "สระว่ายน้ำ",
};

// ถ้าต้องการใช้ env ให้เปลี่ยนเป็น import.meta.env ตามโปรเจกต์จริง
const BACKEND = "http://localhost:8000";

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

export default function CheckinPage() {
  const [currentFacility, setCurrentFacility] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<{ k: string; name: string } | null>(null);
  const [students, setStudents] = useState("");
  const [staff, setStaff] = useState("");
  const [error, setError] = useState("");
  // เก็บว่าสนามกลางแจ้งตัวไหนเช็คอินแล้วบ้าง (session นี้ + เก็บลง localStorage)
  const [completedOutdoorSubs, setCompletedOutdoorSubs] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("checkin_outdoor_done_list");
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? (arr as string[]) : [];
    } catch {
      return [];
    }
  });

  const displayName = window.CURRENT_USER || "ผู้ใช้งาน";

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

  function onTopClick(f: { k: string; name: string }) {
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

  async function doCheckin() {
    if (!canSubmit) return;
    setError("");

    const csrftoken = getCookie("csrftoken") || "";

    const body = {
      facility: currentFacility,
      outdoor_sub: currentFacility === "outdoor" ? selectedSub?.k || "" : "",
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

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "บันทึกไม่สำเร็จ");
      }

      // โชว์ overlay เช็คอินสำเร็จ
      const ov = document.getElementById("overlay");
      if (ov) {
        ov.classList.add("show");
        setTimeout(() => {
          ov.classList.remove("show");
        }, 900);
      }

      // เคลียร์จำนวน
      setStudents("");
      setStaff("");

      // ---------- กฎสนามกลางแจ้ง: ต้องกรอกให้ครบทุกสนามก่อนประเมิน ----------
      if (currentFacility === "outdoor" && selectedSub) {
        setCompletedOutdoorSubs((prev) => {
          const already = prev.includes(selectedSub.k);
          const next = already ? prev : [...prev, selectedSub.k];

          // เซฟลง localStorage ให้ใช้ข้ามหน้าได้
          try {
            localStorage.setItem("checkin_outdoor_done_list", JSON.stringify(next));
          } catch {}

          const allDone = OUTDOOR_SUBS.every((s) => next.includes(s.k));
          if (allDone) {
            // เซฟวันที่วันนี้ว่า outdoor ครบแล้ว
            const todayKey = new Date().toISOString().slice(0, 10);
            try {
              localStorage.setItem("checkin_outdoor_done_date", todayKey);
            } catch {}

            // เด้งถามว่าจะไปหน้าแบบประเมินไหม (หลัง overlay นิดหน่อย)
            setTimeout(() => {
              const go = window.confirm(
                "วันนี้คุณเช็คอินสนามกลางแจ้งครบทุกประเภทแล้ว\nต้องการไปกรอกแบบประเมินเลยหรือไม่?"
              );
              if (go) {
                window.location.href = "/checkin_feedback";
              }
            }, 950);
          }

          return next;
        });
      }
    } catch (e: any) {
      setError(e?.message || "บันทึกไม่สำเร็จ");
    }
  }

  return (
    <div className="wrap" data-page="checkin">
      <HeaderUser displayName={displayName} BACKEND={BACKEND} />

      <main>
        <span id="todayDate" className="date-badge" aria-live="polite" />

        {/* ชั้นที่ 1 เลือกประเภทสนาม */}
        {!currentFacility && (
          <section className="card" id="panel-top">
            <h3 className="h3">เลือกประเภทสนาม</h3>
            <p className="hint">
              กรุณาเลือกประเภทสนามที่ต้องการบันทึกการใช้งานก่อน
            </p>
            <div className="grid" id="grid-top">
              {TOP.map((f) => (
                <button
                  key={f.k}
                  className="btn"
                  type="button"
                  onClick={() => onTopClick(f)}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ชั้นที่ 2 ฟอร์มกรอกจำนวน */}
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
                เลือกชนิดสนาม และกรอกจำนวนผู้ใช้บริการในช่วงเวลานี้
              </span>
            </div>

            {/* ชื่อสนามด้านบน */}
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
                ? selectedSub?.name || ""
                : SINGLE_FACILITY_NAMES[currentFacility] || ""}
            </h2>

            {/* ปุ่มสนามย่อย (เฉพาะกลางแจ้ง) */}
            {currentFacility === "outdoor" && (
              <div className="grid" id="grid-outdoor">
                {OUTDOOR_SUBS.map((s) => (
                  <button
                    key={s.k}
                    className={`btn sport-btn ${
                      selectedSub?.k === s.k ? "active" : ""
                    }`}
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
          <p className="hint" style={{ marginTop: 8 }}>
            ระบบบันทึกข้อมูลการใช้สนามเรียบร้อยแล้ว
          </p>
        </div>
      </div>
    </div>
  );
}
