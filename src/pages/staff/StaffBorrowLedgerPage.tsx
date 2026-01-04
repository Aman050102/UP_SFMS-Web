import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import HeaderStaff from "../../components/HeaderStaff";
import "../../styles/staff_ledger.css";

// ---------------- Backend ----------------
const BACKEND: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";

const API_RECORDS = `${BACKEND}/api/staff/borrow-records/`;

// ---------------- Types ----------------
interface LedgerRow {
  id?: number;
  time?: string;
  occurred_at?: string;
  student_id?: string;
  faculty?: string;
  equipment?: string;
  action?: "borrow" | "return";
  qty?: number;
}

interface LedgerDay {
  date: string;
  total?: number;
  rows: LedgerRow[];
}

// ---------------- Component ----------------
export default function StaffBorrowLedgerPage() {
  const [displayName] = useState<string>(
    localStorage.getItem("display_name") || "เจ้าหน้าที่"
  );

  const [studentId, setStudentId] = useState<string>("");
  const [datePick, setDatePick] = useState<string>("");

  const [days, setDays] = useState<LedgerDay[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [info, setInfo] = useState<string>("—");
  const [error, setError] = useState<string>("");

  const todayISO = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );

  // mark page (css hook)
  useEffect(() => {
    document.body.setAttribute("data-page", "staff-borrow-ledger");
    return () => {
      document.body.removeAttribute("data-page");
    };
  }, []);

  // default date = today
  useEffect(() => {
    setDatePick(todayISO);
  }, [todayISO]);

  // auto load when date changes
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
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) throw new Error("load failed");

      const data = await res.json();
      const list: LedgerDay[] = data?.days || [];

      setDays(list);

      if (!list.length) {
        setInfo("ไม่พบข้อมูลในเงื่อนไขที่เลือก");
      } else {
        const total = list.reduce(
          (sum, d) => sum + (d.total ?? d.rows.length),
          0
        );
        setInfo(`พบทั้งหมด ${total} รายการ ใน ${list.length} วัน`);
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

  // ---------------- UI ----------------
  return (
    <div className="staff-ledger-page">
      <HeaderStaff displayName={displayName} BACKEND={BACKEND} />

      <main className="wrap">
        <nav className="mainmenu" aria-label="เมนูหลัก">
          <ul>
            <li>
              <Link className="tab" to="/staff/equipment">
                จัดการอุปกรณ์กีฬา
              </Link>
            </li>
            <li>
              <Link className="tab active" to="/staff/borrow-ledger">
                ✓ บันทึกการยืม-คืน
              </Link>
            </li>
          </ul>
        </nav>

        <h1 className="page-title">บันทึกการยืม–คืน (รายวัน)</h1>

        <div className="filter-row">
          <label className="fld">
            <span>รหัสนิสิต</span>
            <input
              value={studentId}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setStudentId(e.target.value)
              }
              placeholder="เช่น 65000001"
            />
          </label>

          <label className="fld">
            <span>วันที่</span>
            <input
              type="date"
              value={datePick}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDatePick(e.target.value)
              }
            />
          </label>

          <button className="btn primary" onClick={fetchRecords} type="button">
            ค้นหา
          </button>

          <button
            className="btn"
            onClick={() => setDatePick(todayISO)}
            type="button"
          >
            วันนี้
          </button>

          <span className="flex1" />
        </div>

        <section className="panel">
          <div className="result-info">
            {loading ? "กำลังโหลด..." : info}
          </div>

          {error && <div className="empty">{error}</div>}

          <div className="day-groups">
            {!loading && !error && days.length === 0 && (
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

// ---------------- Sub Component ----------------
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
                <tr key={r.id ?? i}>
                  <td>{r.time || r.occurred_at || "-"}</td>
                  <td>{r.student_id || "-"}</td>
                  <td>{r.faculty || "-"}</td>
                  <td>{r.equipment || "-"}</td>
                  <td>{r.action === "return" ? "คืน" : "ยืม"}</td>
                  <td>{r.qty ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
