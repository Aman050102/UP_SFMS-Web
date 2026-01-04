// src/components/sidebar/SidebarUser.tsx
import "../../styles/sidebar.css";

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
        <a href="/user/menu">🏠 หน้าแรก</a>
        <a href="/checkin">✅ เช็คอินสนาม</a>
        <a href="/equipment">🏀 ยืมอุปกรณ์</a>

        <div className="sidebar-user">ผู้ใช้งาน</div>
      </aside>
    </>
  );
}
