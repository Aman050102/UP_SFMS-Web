import React, { useEffect, useState } from "react";
import HeaderUser from "../../components/HeaderUser";
import "../../styles/checkin_feedback.css";

const BACKEND =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";

type FacilityKey = "outdoor" | "badminton" | "track" | "pool";

const FACILITY_LABELS: Record<FacilityKey, string> = {
  outdoor: "สนามกลางแจ้ง",
  badminton: "สนามแบดมินตัน",
  track: "สนามลู่-ลาน",
  pool: "สระว่ายน้ำ",
};

const formatThaiDate = (date: Date): string => {
  const parts = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(date);

  const year = date.getFullYear() + 543;
  return parts.map(p => (p.type === "year" ? String(year) : p.value)).join("");
};

export default function CheckinFeedback(): JSX.Element {
  const [facility, setFacility] = useState<FacilityKey>("outdoor");
  const [staffName, setStaffName] = useState("ผู้ใช้งาน");
  const [problems, setProblems] = useState("");
  const [detail, setDetail] = useState("");
  const [suggest, setSuggest] = useState("");
  const [improve, setImprove] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayThai = formatThaiDate(today);

  // --- init ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fac = params.get("facility") as FacilityKey | null;

    const allowed: FacilityKey[] = ["outdoor", "badminton", "track", "pool"];
    const current = allowed.includes(fac as FacilityKey)
      ? fac!
      : "outdoor";

    setFacility(current);

    try {
      const doneRaw = localStorage.getItem("checkin_facility_done");
      if (doneRaw) {
        const parsed = JSON.parse(doneRaw);
        if (parsed.date === todayStr && parsed.facilities?.[current]) {
          alert("คุณได้ส่งแบบประเมินของสนามนี้ไปแล้ว");
          window.location.href = "/checkin";
        }
      }
    } catch {}

    const name =
      (window as any).CURRENT_USER ||
      localStorage.getItem("display_name") ||
      "ผู้ใช้งาน";
    setStaffName(name);
  }, [todayStr]);

  const canSubmit =
    problems.trim() ||
    detail.trim() ||
    suggest.trim() ||
    improve.trim() ||
    !!file;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!canSubmit) {
      setError("กรุณากรอกข้อมูลอย่างน้อย 1 ช่อง");
      return;
    }

    try {
      setSubmitting(true);

      const form = new FormData();
      form.append("date", todayStr);
      form.append("facility", facility);
      form.append("facility_label", FACILITY_LABELS[facility]);
      form.append("staff_name", staffName);
      form.append("problems", problems);
      form.append("detail", detail);
      form.append("suggest", suggest);
      form.append("improve", improve);
      if (file) form.append("file", file);

      // 🔧 backend endpoint
      // await fetch(`${BACKEND}/api/checkin/feedback/`, { method: "POST", body: form });

      console.log("SUBMIT:", Object.fromEntries(form.entries()));

      // mark completed
      const stored = JSON.parse(
        localStorage.getItem("checkin_facility_feedback") || "{}"
      );
      stored.date = todayStr;
      stored.facilities = { ...(stored.facilities || {}), [facility]: true };
      localStorage.setItem(
        "checkin_facility_feedback",
        JSON.stringify(stored)
      );

      setOk(`บันทึกแบบประเมิน ${FACILITY_LABELS[facility]} เรียบร้อยแล้ว`);
      setProblems("");
      setDetail("");
      setSuggest("");
      setImprove("");
      setFile(null);
    } catch {
      setError("ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-page="checkin-feedback" className="wrap">
      <HeaderUser displayName={staffName} BACKEND={BACKEND} />

      <main>
        <section className="fb-card">
          <header className="fb-header">
            <h1>แบบประเมินการใช้งาน{FACILITY_LABELS[facility]}</h1>
            <p className="fb-subtitle">
              กรุณากรอกข้อมูลหลังใช้งานสนามในวันนี้
            </p>
          </header>

          <form className="fb-form" onSubmit={handleSubmit}>
            <div className="fb-field">
              <label>ปัญหาที่พบ</label>
              <textarea
                value={problems}
                onChange={(e) => setProblems(e.target.value)}
              />
            </div>

            <div className="fb-field">
              <label>รายละเอียดเพิ่มเติม</label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
              />
            </div>

            <div className="fb-field">
              <label>ข้อเสนอแนะ</label>
              <textarea
                value={suggest}
                onChange={(e) => setSuggest(e.target.value)}
              />
            </div>

            <div className="fb-field">
              <label>ไฟล์แนบ</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            {error && <p className="fb-error">{error}</p>}
            {ok && <p className="fb-ok">{ok}</p>}

            <div className="fb-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? "กำลังบันทึก..." : "ส่งแบบประเมิน"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
