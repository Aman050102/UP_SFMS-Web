import React from "react";

import { Home, LayoutDashboard, Package, ClipboardList, BarChart3, Settings } from "lucide-react";
import "../styles/sidebar.css";

export default function SidebarStaff({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // ดึงชื่อแอดมินจาก localStorage
  const displayName = localStorage.getItem("display_name") || "ผู้ดูแลระบบ";

  return (
    <>

      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-header" style={{padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center'}}>
            <img src="/img/dsa.png" alt="Logo" style={{height: '45px'}} />
        </div>

        <a href="/staff/menu" onClick={onClose}>
          <Home size={20} strokeWidth={2.5} color="#5f5aa2" /> หน้าแรก
        </a>
        <a href="/staff/menu" onClick={onClose}>
          <LayoutDashboard size={20} strokeWidth={2.5} color="#333" /> แดชบอร์ด
        </a>
        <a href="/staff_equipment" onClick={onClose}>
          <Package size={20} strokeWidth={2.5} color="#333" /> จัดการอุปกรณ์
        </a>
        <a href="/staff/borrow-ledger" onClick={onClose}>
          <ClipboardList size={20} strokeWidth={2.5} color="#333" /> ยืม–คืน
        </a>
        <a href="/staff_borrow_stats" onClick={onClose}>
          <BarChart3 size={20} strokeWidth={2.5} color="#333" /> รายงาน
        </a>

        <div className="sidebar-user" style={{marginTop: 'auto', padding: '20px', borderTop: '1px solid #eee', fontWeight: 'bold', color: '#5f5aa2', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <Settings size={22} strokeWidth={2.5} />
            <span>{displayName}</span>
        </div>
      </aside>
    </>
  );
}
