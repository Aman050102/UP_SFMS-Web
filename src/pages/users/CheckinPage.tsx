import React, { useEffect, useState } from "react";
import HeaderUser from "../../components/HeaderUser";
import "../../styles/checkin.css";

/* =======================
   Types
======================= */
type FacilityKey = "outdoor" | "badminton" | "track" | "pool";
type OutdoorKey =
  | "tennis"
  | "basketball"
  | "futsal"
  | "football"
  | "volleyball"
  | "sepak_takraw"
  | "badminton";

interface FacilityMap {
  [key: string]: boolean;
}

interface FacilityItem {
  k: string;
  name: string;
}

/* =======================
   Constants
======================= */
const TOP: FacilityItem[] = [
  { k: "outdoor", name: "สนามกลางแจ้ง" },
  { k: "badminton", name: "สนามแบดมินตัน" },
  { k: "track", name: "สนามลู่-ลาน" },
  { k: "pool", name: "สระว่ายน้ำ" },
];

const OUTDOOR_SUBS: { k: OutdoorKey; name: string }[] = [
  { k: "tennis", name: "เทนนิส" },
  { k: "basketball", name: "บาสเกตบอล" },
  { k: "futsal", name: "ฟุตซอล" },
  { k: "football", name: "ฟุตบอล" },
  { k: "volleyball", name: "วอลเลย์บอล" },
  { k: "sepak_takraw", name: "เซปักตะกร้อ" },
  { k: "badminton", name: "แบดมินตัน" },
];

const OUTDOOR_KEYS = OUTDOOR_SUBS.map(s => `outdoor:${s.k}`);

const FACILITY_LABELS: Record<string, string> = {
  outdoor: "สนามกลางแจ้ง",
  badminton: "สนามแบดมินตัน",
  track: "สนามลู่-ลาน",
  pool: "สระว่ายน้ำ",
};

/* =======================
   Helpers
======================= */
const getCookie = (name: string): string | null => {
  const m = document.cookie.match(new RegExp(`(^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[2]) : null;
};

/* =======================
   Component
======================= */
export default function CheckinPage(): JSX.Element {
  const BACKEND =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
      /\/$/,
      ""
    ) || "";

  const [currentFacility, setCurrentFacility] =
    useState<FacilityKey | null>(null);
  const [selectedSub, setSelectedSub] = useState<{
    k: OutdoorKey;
    name: string;
  } | null>(null);

  const [students, setStudents] = useState("");
  const [staff, setStaff] = useState("");
  const [error, setError] = useState("");

  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const [facilityDone, setFacilityDone] = useState<Record<string, boolean>>({});
  const [facilityFeedback, setFacilityFeedback] = useState<Record<string, boolean>>(
    {}
  );

  const displayName =
    (window as any).CURRENT_USER ||
    localStorage.getItem("display_name") ||
    "ผู้ใช้งาน";

  const todayStr = new Date().toISOString().slice(0, 10);

  /* =======================
     Load saved progress
  ====================== */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("checkin_progress");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.date === todayStr && parsed.done) {
        setDoneMap(parsed.done);
      }
    } catch {}
  }, [todayStr]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("checkin_facility_done");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.date === todayStr) setFacilityDone(parsed.facilities || {});
    } catch {}
  }, [todayStr]);

  /* =======================
     Logic
  ====================== */
  const canSubmit =
    currentFacility &&
    Number(students) >= 0 &&
    Number(staff) >= 0 &&
    (currentFacility !== "outdoor" || !!selectedSub);

  const isOutdoorDone = (map: Record<string, boolean>) =>
    OUTDOOR_KEYS.every((k) => map[k]);

  const doCheckin = async () => {
    if (!canSubmit) return;

    let key: string | null = null;
    if (currentFacility === "outdoor" && selectedSub) {
      key = `outdoor:${selectedSub.k}`;
    } else if (currentFacility) {
      key = currentFacility;
    }

    if (key && doneMap[key]) {
      setError("รายการนี้ถูกบันทึกแล้ว");
      return;
    }

    const payload = {
      facility: currentFacility,
      outdoor_sub: selectedSub?.k ?? "",
      count: Number(students) + Number(staff),
    };

    try {
      const res = await fetch(`${BACKEND}/api/checkin/event/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken") || "",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error();

      const next = { ...doneMap, [key!]: true };
      setDoneMap(next);
      localStorage.setItem(
        "checkin_progress",
        JSON.stringify({ date: todayStr, done: next })
      );

      if (currentFacility) {
        const doneAll =
          currentFacility === "outdoor"
            ? OUTDOOR_KEYS.every((k) => next[k])
            : true;

        if (doneAll) {
          const done = {
            ...(JSON.parse(
              localStorage.getItem("checkin_facility_done") || "{}"
            )?.facilities || {}),
            [currentFacility]: true,
          };
          localStorage.setItem(
            "checkin_facility_done",
            JSON.stringify({ date: todayStr, facilities: done })
          );
          setFacilityDone(done);
        }
      }
    } catch {
      setError("บันทึกไม่สำเร็จ");
    }
  };

  /* =======================
     Render
  ====================== */
  return (
    <div className="wrap" data-page="checkin">
      <HeaderUser displayName={displayName} BACKEND={BACKEND} />

      <main>
        <span className="date-badge">
          {new Date().toLocaleDateString("th-TH", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>

        {/* เลือกประเภทสนาม */}
        {!currentFacility && (
          <section className="card">
            <h3>เลือกประเภทสนาม</h3>
            <div className="grid-top">
              {TOP.map((f) => (
                <button
                  key={f.k}
                  className="btn"
                  onClick={() => setCurrentFacility(f.k as FacilityKey)}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ฟอร์ม */}
        {currentFacility && (
          <section className="card">
            <h3>
              {currentFacility === "outdoor"
                ? "สนามกลางแจ้ง"
                : FACILITY_LABELS[currentFacility]}
            </h3>

            {currentFacility === "outdoor" && (
              <div className="grid-outdoor">
                {OUTDOOR_SUBS.map((s) => (
                  <button
                    key={s.k}
                    className={
                      "btn " +
                      (selectedSub?.k === s.k ? "active" : "")
                    }
                    onClick={() => setSelectedSub(s)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            <div className="form">
              <input
                type="number"
                placeholder="จำนวนนิสิต"
                value={students}
                onChange={(e) => setStudents(e.target.value)}
              />
              <input
                type="number"
                placeholder="จำนวนบุคลากร"
                value={staff}
                onChange={(e) => setStaff(e.target.value)}
              />

              <button onClick={doCheckin} disabled={!canSubmit}>
                บันทึก
              </button>
            </div>

            {error && <p className="error">{error}</p>}
          </section>
        )}
      </main>
    </div>
  );
}
