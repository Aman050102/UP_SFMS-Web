import { useEffect, useState, useMemo, type ChangeEvent } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import HeaderStaff from "../../components/HeaderStaff";
import "../../styles/borrow_stats.css";

// ลงทะเบียน ChartJS Modules
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ---------- Types ----------
interface StatItem {
  label: string;
  count: number;
}

interface StatsResponse {
  ok: boolean;
  data: StatItem[];
}

const BACKEND: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";

const API_STATS = `${BACKEND}/api/staff/borrow-stats/`;

export default function StaffBorrowStatsPage() {
  const [displayName] = useState<string>(
    localStorage.getItem("display_name") || "เจ้าหน้าที่"
  );
  
  // Date State
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dateFrom, setDateFrom] = useState<string>(todayISO);
  const [dateTo, setDateTo] = useState<string>(todayISO);
  
  // Data State
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch Logic
  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: dateFrom,
        end_date: dateTo,
      });
      const res = await fetch(`${API_STATS}?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Network response was not ok");
      
      const result: StatsResponse = await res.json();
      if (result.ok) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // โหลดข้อมูลเมื่อวันที่เปลี่ยน (เหมือน Logic เดิมใน JS)
  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  // คำนวณยอดรวม
  const totalCount = useMemo(() => {
    return stats.reduce((sum, item) => sum + item.count, 0);
  }, [stats]);

  // Chart Data Configuration
  const chartData: ChartData<"bar"> = {
    labels: stats.map((item) => item.label),
    datasets: [
      {
        label: "จำนวนครั้งการยืม",
        data: stats.map((item) => item.count),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Export & Print Handlers
  const handleExportExcel = () => {
    const url = `${BACKEND}/api/staff/export-borrow-stats-csv/?start_date=${dateFrom}&end_date=${dateTo}`;
    window.location.href = url;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="borrow-stats-page">
      <HeaderStaff displayName={displayName} BACKEND={BACKEND} />

      <main className="wrap">
        <section className="toolbar">
          <div className="date-range">
            <label>ช่วงวันที่ :</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDateFrom(e.target.value)}
            />
            <span>—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDateTo(e.target.value)}
            />
          </div>

          <div className="actions">
            <button className="btn" onClick={handleExportExcel} type="button">
              ดาวน์โหลด Excel
            </button>
            <button className="btn" id="btnPdf" type="button">ดาวน์โหลด PDF</button>
            <button className="btn" id="btnDocx" type="button">ดาวน์โหลด DOCX</button>
            <button className="btn" onClick={handlePrint} type="button">
              พิมพ์เป็น PDF (บราวเซอร์)
            </button>
          </div>
        </section>

        <section className="card">
          <h2 id="monthTitle">สถิติการยืม–คืน</h2>
          <div className="chart-container" style={{ position: "relative", height: "400px", width: "100%" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>กำลังโหลดข้อมูล...</div>
            ) : (
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "top" as const },
                  },
                }}
              />
            )}
          </div>
        </section>

        <section className="card">
          <table className="table" id="tbl">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>ลำดับ</th>
                <th>รายการ</th>
                <th style={{ width: "140px" }}>จำนวนครั้ง</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 && !loading ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "20px" }}>
                    ไม่พบข้อมูลในช่วงเวลาที่เลือก
                  </td>
                </tr>
              ) : (
                stats.map((item, index) => (
                  <tr key={`${item.label}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{item.label}</td>
                    <td>{item.count.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="sum" style={{ fontWeight: "bold", backgroundColor: "#f9f9f9" }}>
                <td colSpan={2}>รวมการยืมอุปกรณ์ทั้งหมด</td>
                <td id="sumCell">{totalCount.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      </main>
    </div>
  );
}