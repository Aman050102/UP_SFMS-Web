import React from "react";
import { Home, CheckCircle, Trophy, User } from "lucide-react"; // นำเข้าไอคอนแทนอิโมจิ
import "../styles/sidebar.css";

export default function SidebarUser({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const displayName = localStorage.getItem("display_name") || "ผู้ใช้งาน";

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-header" style={{padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center'}}>
            <img src="/img/dsa.png" alt="Logo" style={{height: '60px'}} />
        </div>

        <a href="/user/menu" onClick={onClose}>
          <Home size={20} strokeWidth={2.5} color="#5f5aa2" /> หน้าแรก
        </a>
        <a href="/checkin" onClick={onClose}>
          <CheckCircle size={20} strokeWidth={2.5} color="#5f5aa2" /> เช็คอินสนาม
        </a>
        <a href="/equipment" onClick={onClose}>
          <Trophy size={20} strokeWidth={2.5} color="#5f5aa2" /> ยืมอุปกรณ์
        </a>
        <a href="/checkin_feedback" onClick={onClose}>
          <CheckCircle size={20} strokeWidth={2.5} color="#ec4899" /> แบบประเมิน
        </a>

        <div className="sidebar-user" style={{marginTop: 'auto', padding: '20px', borderTop: '1px solid #eee', fontWeight: 'bold', color: '#5f5aa2', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <User size={22} strokeWidth={2.5} /> {displayName}
        </div>
      </aside>
    </>
  );
}
