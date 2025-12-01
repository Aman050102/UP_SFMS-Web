// src/pages/staff/StaffBorrowLedgerPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import HeaderStaff from "../../components/HeaderStaff";
import "../../styles/staff_ledger.css";

// ใช้ BASE URL จาก .env
const BACKEND = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

// GET /api/staff/borrow-records/?student_id=...&date=YYYY-MM-DD
const API_RECORDS = `${BACKEND}/api/staff/borrow-records/`;

export default function StaffBorrowLedgerPage() {
  const [displayName, setDisplayName] = useState(
    localStorage.getItem("display_name") || "เจ้าหน้าที่"
  );

  const [studentId, setStudentId] = useState("");
  const [datePick, setDatePick] = useState("");
  const [info, setInfo] = useState("—");

  const [days, setDays] = useState([]); // [{date, total, rows:[...]}]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // today ISO
  const todayISO = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );

  // เซ็ต theme ให้ body (ให้ตรงกับ CSS: body[data-page="staff-borrow-ledger"])
  useEffect(() => {
    document.body.setAttribute("data-page", "staff-borrow-ledger");
    return () => {
      document.body.removeAttribute("data-page");
    };
  }, []);

  // โหลดข้อมูล user staff (กันกรณียังไม่เข้าผ่าน StaffMenu)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch(`${BACKEND}/auth/me/`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("not ok");
        const data = await res.json();
        if (data?.ok && data?.username) {
          setDisplayName(data.username);
          localStorage.setItem("display_name", data.username);
        } else {
          window.location.href = "/login?role=staff";
        }
      } catch {
        window.location.href = "/login?role=staff";
      }
    };
    loadUser();
  }, []);

  // โหลดครั้งแรก → เซ็ตวันที่วันนี้ + ยิงค้นหา
  useEffect(() => {
    setDatePick(todayISO);
  }, [todayISO]);

  useEffect(() => {
    if (!datePick) return;
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datePick]);

  async function fetchRecords() {
    setLoading(true);
    setError("");
    setInfo("กำลังโหลด...");

    try {
      const params = new URLSearchParams();
      if (studentId.trim()) {
        params.set("student_id", studentId.trim());
      }
      if (datePick) {
        params.set("date", datePick);
      }

      const url = `${API_RECORDS}?${params.toString()}`;
      const res = await fetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        setError("โหลดข้อมูลไม่สำเร็จ");
        setInfo("โหลดข้อมูลไม่สำเร็จ");
        setDays([]);
        return;
      }

      const data = await res.json().catch(() => ({}));

      // สมมติ backend ส่งรูปแบบ:
      // { ok: true, days: [ { date, total, rows: [...] }, ... ] }
      const list = (data && (data.days || data.data || [])) || [];
      setDays(list);

      if (!list.length) {
        setInfo("ไม่พบข้อมูลในเงื่อนไขที่เลือก");
      } else {
        const totalAll = list.reduce(
          (sum, d) => sum + (d.total || 0),
          0
        );
        setInfo(`พบทั้งหมด ${totalAll} รายการ ใน ${list.length} วัน`);
      }
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setInfo("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setDays([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchClick() {
    fetchRecords();
  }

  function handleTodayClick() {
    setDatePick(todayISO);
  }

  return (
    <div className="staff-ledger-page">
      {/* Header แบบเดียวกับหน้า staff อื่น */}
      <HeaderStaff displayName={displayName} BACKEND={BACKEND} />

      <main className="wrap">
        {/* แถบสลับเหมือนหน้า staff_equipment */}
        <nav className="mainmenu" aria-label="เมนูหลัก">
          <ul>
            <li>
              <a className="tab" href="/staff_equipment">
                จัดการอุปกรณ์กีฬา
              </a>
            </li>
            <li>
              <a className="tab active" href="/staff/borrow-ledger">
                ✓ บันทึกการยืม-คืน
              </a>
            </li>
          </ul>
        </nav>

        <h1 className="page-title">บันทึกการยืม–คืน (รายวัน)</h1>

        {/* แถว filter */}
        <div className="filter-row">
          <label className="fld">
            <span>รหัสนิสิต</span>
            <input
              id="studentId"
              type="text"
              placeholder="เช่น 65000001"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </label>

          <label className="fld">
            <span>วันที่</span>
            <input
              id="datePick"
              type="date"
              value={datePick}
              onChange={(e) => setDatePick(e.target.value)}
            />
          </label>

          <button
            id="btnSearch"
            className="btn primary"
            type="button"
            onClick={handleSearchClick}
          >
            ค้นหา
          </button>

          <button
            id="btnToday"
            className="btn"
            type="button"
            onClick={handleTodayClick}
          >
            วันนี้
          </button>

          <span className="flex1" />
        </div>

        {/* Panel แสดงผล */}
        <section className="panel">
          <div id="resultInfo" className="result-info">
            {loading ? "กำลังโหลด..." : info}
          </div>

          {error && <div className="empty">{error}</div>}

          {/* กลุ่มรายวัน */}
          <div id="dayGroups" className="day-groups" aria-live="polite">
            {(!days || days.length === 0) && !loading && !error && (
              <div className="empty">ยังไม่มีข้อมูลในวันนี้</div>
            )}

            {days.map((day, idx) => (
              <DayCard key={day.date || idx} day={day} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

// แสดงการ์ดแต่ละวัน + ตารางด้านใน
function DayCard({ day }) {
  const rows = day.rows || [];
  const total = day.total ?? rows.length;

  return (
    <article className="day-card">
      <header className="day-title">
        <div className="date">{day.date}</div>
        <div className="count">รวม {total} รายการ</div>
      </header>

      <div className="table-wrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>เวลา</th>
              <th>รหัสนิสิต</th>
              <th>คณะ</th>
              <th>อุปกรณ์</th>
              <th>ประเภท</th>
              <th>จำนวน</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty">
                  ไม่มีข้อมูลในวันนี้
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id || i}>
                  <td className="time">
                    <span className="time-badge">
                      {r.time || r.occurred_at || "-"}
                    </span>
                  </td>
                  <td className="sid">
                    <span className="mono">
                      {r.student_id || r.sid || "-"}
                    </span>
                  </td>
                  <td className="fac">{r.faculty || "-"}</td>
                  <td>{r.equipment || r.equipment_name || "-"}</td>
                  <td>{r.action === "return" ? "คืน" : "ยืม"}</td>
                  <td>{r.qty ?? r.quantity ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
