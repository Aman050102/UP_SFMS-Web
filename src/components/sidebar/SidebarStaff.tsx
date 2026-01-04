// src/components/sidebar/SidebarAdmin.tsx
import "../../styles/sidebar.css";

export default function SidebarAdmin({
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
        <a href="/admin/dashboard">🏠 แดชบอร์ด</a>
        <a href="/admin/equipment">🏀 จัดการอุปกรณ์</a>
        <a href="/admin/borrow">📄 ยืม–คืน</a>
        <a href="/admin/report">📊 รายงาน</a>

        <div className="sidebar-user">แอดมิน</div>
      </aside>
    </>
  );
}
