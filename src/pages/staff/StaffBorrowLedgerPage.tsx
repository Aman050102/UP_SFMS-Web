import React, { useEffect, useMemo, useState } from "react";
import HeaderStaff from "../../components/HeaderStaff";
import "../../styles/staff_ledger.css";

// ---------------- Backend ----------------
const BACKEND: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";

const API_RECORDS = `${BACKEND}/api/staff/borrow-records/`;

// ---------- Types ----------
interface LedgerRow {
  id?: number;
  time?: string;
  occurred_at?: string;
  student_id?: string;
  sid?: string;
  faculty?: string;
  equipment?: string;
  equipment_name?: string;
  action?: "borrow" | "return";
  qty?: number;
  quantity?: number;
}

interface LedgerDay {
  date: string;
  total?: number;
  rows: LedgerRow[];
}

// ---------- Component ----------
export default function StaffBorrowLedgerPage() {
  const [displayName, setDisplayName] = useState<string>(
    localStorage.getItem("display_name") || "เจ้าหน้าที่"
  );

  const [studentId, setStudentId] = useState<string>("");
  const [datePick, setDatePick] = useState<string>("");
  const [info, setInfo] = useState<string>("—");

  const [days, setDays] = useState<LedgerDay[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [info, setInfo] = useState<string>("—");
  const [error, setError] = useState<string>("");

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // set body theme
  useEffect(() => {
    document.body.setAttribute("data-page", "staff-borrow-ledger");
    return () => { document.body.removeAttribute("data-page"); };
  }, []);

  // load staff info
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch(`${BACKEND}/auth/me/`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error();
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

  useEffect(() => {
    setDatePick(todayISO);
  }, [todayISO]);

  useEffect(() => {
    if (datePick) fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datePick]);

  // ---------------- Data ----------------
  async function fetchRecords(): Promise<void> {
    setLoading(true);
    setError("");
    setInfo("กำลังโหลด...");
    try {
      const params = new URLSearchParams();
      if (studentId.trim()) params.set("student_id", studentId.trim());
      if (datePick) params.set("date", datePick);

      const res = await fetch(`${API_RECORDS}?${params.toString()}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");

      const data = await res.json();
      const list: LedgerDay[] = data?.days || data?.data || [];

      setDays(list);

      if (!list.length) {
        setInfo("ไม่พบข้อมูลในเงื่อนไขที่เลือก");
      } else {
        const total = list.reduce(
          (sum, d) => sum + (d.total ?? 0),
          0
        );
        setInfo(`พบทั้งหมด ${total} รายการ ใน ${list.length} วัน`);
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setInfo("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setDays([]);
    } finally { setLoading(false); }
  }

  // ---------------- UI ----------------
  return (
    <div className="staff-ledger-page">
      <main className="wrap">
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

        <div className="filter-row">
          <label className="fld">
            <span>รหัสนิสิต</span>
            <input
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="เช่น 65000001"
            />
          </label>
          <label className="fld">
            <span>วันที่</span>
            <input
              type="date"
              value={datePick}
              onChange={(e) => setDatePick(e.target.value)}
            />
          </label>

          <button className="btn primary" onClick={fetchRecords}>
            ค้นหา
          </button>

          <button className="btn" onClick={() => setDatePick(todayISO)}>
            วันนี้
          </button>

          <span className="flex1" />
        </div>

        <section className="panel">
          <div className="result-info">{loading ? "กำลังโหลด..." : info}</div>
          {error && <div className="empty">{error}</div>}
          <div className="day-groups">
            {!loading && !error && days.length === 0 && <div className="empty">ยังไม่มีข้อมูลในวันนี้</div>}
            {days.map((day, idx) => <DayCard key={day.date || idx} day={day} />)}
          </div>
        </section>
      </main>
    </div>
  );
}

// ---------- Sub Component ----------
function DayCard({ day }: { day: LedgerDay }) {
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
            <tr><th>เวลา</th><th>รหัสนิสิต</th><th>คณะ</th><th>อุปกรณ์</th><th>ประเภท</th><th>จำนวน</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="empty">ไม่มีข้อมูลในวันนี้</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id ?? i}>
                  <td>{r.time || r.occurred_at || "-"}</td>
                  <td>{r.student_id || r.sid || "-"}</td>
                  <td>{r.faculty || "-"}</td>
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
