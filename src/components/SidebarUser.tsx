import React from "react";
import "../styles/sidebar.css"; 

export default function SidebarUser({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-header" style={{padding: '20px', fontWeight: 'bold', borderBottom: '1px solid #eee'}}>
            เมนูผู้ใช้งาน
        </div>
        <a href="/user/menu" onClick={onClose}>🏠 หน้าแรก</a>
        <a href="/checkin" onClick={onClose}>✅ เช็คอินสนาม</a>
        <a href="/equipment" onClick={onClose}>🏀 ยืมอุปกรณ์</a>

        <div className="sidebar-user" style={{marginTop: 'auto', padding: '20px', borderTop: '1px solid #eee'}}>
            User Mode
        </div>
      </aside>
    </>
  );
}
