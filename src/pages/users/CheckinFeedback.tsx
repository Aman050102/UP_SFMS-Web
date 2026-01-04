import React, { useEffect, useState } from "react";
import "../../styles/checkin_feedback.css";

const FACILITY_LABELS = {
  outdoor: "สนามกลางแจ้ง",
  badminton: "สนามแบดมินตัน",
  track: "สนามลู่-ลาน",
  pool: "สระว่ายน้ำ",
};

export default function CheckinFeedback() {
  const [facility, setFacility] = useState("");
  const [problems, setProblems] = useState("");
  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setFacility(search.get("facility") || "outdoor");
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    alert("ส่งข้อมูลเรียบร้อย");
    window.location.href = "/user/menu";
  };

  return (
    <div className="wrap" data-page="checkin-feedback">
      <main>
        <section className="fb-card">
          <h1>แบบประเมิน {FACILITY_LABELS[facility]}</h1>
          <form className="fb-form" onSubmit={onSubmit}>
            <div className="fb-field">
              <label>ปัญหาที่พบ</label>
              <textarea className="fb-textarea" value={problems} onChange={e => setProblems(e.target.value)} />
            </div>
            <button type="submit" className="fb-btn-primary">ยืนยันการส่ง</button>
          </form>
        </section>
      </main>
    </div>
  );
}
