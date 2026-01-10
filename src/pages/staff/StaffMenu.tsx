import React, { useEffect, useState } from "react";
import { FileText, PieChart, Package, ClipboardList } from "lucide-react";
import "../../styles/menu.css";

export default function StaffMenu() {
  const [displayName, setDisplayName] = useState("กำลังโหลด...");

  useEffect(() => {
    // ดึงชื่อจาก localStorage มาแสดงผล
    const dn = localStorage.getItem("display_name") || "เจ้าหน้าที่";
    setDisplayName(dn);
  }, []);

  return (
    <div data-page="staff_menu">
      <main>
        <section className="grid" aria-label="เมนูด่วน">
          <a className="tile" href="/checkin_report">
            <div className="tile-inner">
              <FileText size={60} strokeWidth={2.5} color="#5f5aa2" />
              <b>ข้อมูลการเข้าใช้สนาม</b>
              <small>ดู/ค้นหา/ดาวน์โหลด</small>
            </div>
          </a>

          <a className="tile" href="/staff_borrow_stats">
            <div className="tile-inner">
              <PieChart size={60} strokeWidth={2.5} color="#5f5aa2" />
              <b>ข้อมูลสถิติการยืม-คืน</b>
              <small>สรุปยอด/แนวโน้ม</small>
            </div>
          </a>

          {/* ลิงก์ที่ปรับให้ตรงกับ API/Frontend Route */}
          <a className="tile" href="/staff/equipment">
            <div className="tile-inner">
              <Package size={60} strokeWidth={2.5} color="#5f5aa2" />
              <b>จัดการอุปกรณ์กีฬา</b>
              <small>จัดการรายการ/สต็อก</small>
            </div>
          </a>

          <a className="tile" href="/staff/borrow-ledger">
            <div className="tile-inner">
              <ClipboardList size={60} strokeWidth={2.5} color="#5f5aa2" />
              <b>บันทึกการยืม-คืน</b>
              <small>ดูประวัติรายวัน</small>
            </div>
          </a>
        </section>
      </main>
    </div>
  );
}
