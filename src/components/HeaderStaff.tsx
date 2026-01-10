import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, LogOut, Check, X, ChevronRight, Clock } from "lucide-react";
import "../styles/header.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8787").replace(/\/$/, "");

export default function HeaderStaff({ displayName, onToggleMenu }: any) {
  const navigate = useNavigate();
  const [showNotify, setShowNotify] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [notifications, setNotifications] = useState<any[]>([]);

  // 1. ดึงรายชื่อผู้สมัครใหม่จาก Backend จริง
  const fetchUsers = async () => {
    try {
      // ดึงข้อมูลผู้ใช้ทั้งหมดเพื่อนำมาแสดงใน Tab ทั้งหมด หรือเฉพาะ Pending
      const res = await fetch(`${API}/api/admin/pending-users/`, { credentials: "include" });
      const data = await res.json();
      if (data.ok) setNotifications(data.users);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    const timer = setInterval(fetchUsers, 30000); // Auto refresh ทุก 30 วินาที
    return () => clearInterval(timer);
  }, []);

  // 2. ฟังก์ชันมอบสิทธิ์และอนุมัติ (สุ่ม Role ตามที่แอดมินเลือก)
  const handleApprove = async (id: number, name: string) => {
    const roleChoice = confirm(`อนุมัติ "${name}" เข้าใช้งานระบบ?\n\nตกลง (OK) = เจ้าหน้าที่ (staff)\nยกเลิก (Cancel) = นิสิตช่วยงาน (person)`);
    const assignedRole = roleChoice ? "staff" : "person";

    try {
      const res = await fetch(`${API}/api/admin/approve-user/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: id, assign_role: assignedRole }),
        credentials: "include"
      });

      if (res.ok) {
        alert(`อนุมัติ ${name} เป็น ${assignedRole === 'staff' ? 'เจ้าหน้าที่' : 'นิสิตช่วยงาน'} เรียบร้อย`);
        fetchUsers(); // รีโหลดรายการใหม่ทันที
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการอนุมัติ");
    }
  };

  // กรองข้อมูลตาม Tab ที่เลือก
  const filteredNotify = notifications.filter(n =>
    activeTab === "all" ? true : n.isApproved === 0
  );

  return (
    <header className="topbar">
      <div className="header-left">
        <button className="menu-toggle-btn" onClick={onToggleMenu}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <img src="/img/dsa.png" alt="Logo" className="brand-logo" onClick={() => navigate("/staff/menu")} />
      </div>

      <div className="header-right">
        <div className="dropdown-wrapper">
          <button className={`icon-circle-btn ${showNotify ? 'active' : ''}`} onClick={() => { setShowNotify(!showNotify); setShowProfile(false); }}>
            <Bell size={20} />
            {notifications.filter(n => n.isApproved === 0).length > 0 && (
              <span className="notification-badge">{notifications.filter(n => n.isApproved === 0).length}</span>
            )}
          </button>

          {showNotify && (
            <div className="dropdown-panel notify-panel-minimal">
              <div className="notify-header-tabs">
                <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>ทั้งหมด</button>
                <button className={activeTab === "pending" ? "active" : ""} onClick={() => setActiveTab("pending")}>รออนุมัติ</button>
              </div>
              <div className="notify-list custom-scrollbar">
                {filteredNotify.length === 0 ? (
                  <div style={{padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px'}}>ไม่มีรายการ</div>
                ) : (
                  filteredNotify.map(n => (
                    <div key={n.id} className="notify-row-fancy">
                      <div className="avatar-squircle-gradient">{n.fullName ? n.fullName[0] : n.username[0]}</div>
                      <div className="notify-detail">
                        <p><strong>{n.fullName || n.username}</strong> ส่งคำขอเข้าใช้งาน</p>
                        <span className="time-text"><Clock size={12} /> {new Date(n.createdAt).toLocaleDateString()}</span>
                        {n.isApproved === 0 && (
                          <div className="action-card-sm">
                            <button className="btn-approve-fill" onClick={() => handleApprove(n.id, n.fullName || n.username)}>อนุมัติ/มอบสิทธิ์</button>
                            <button className="btn-reject-ghost" onClick={() => alert("ระบบกำลังพัฒนาส่วนการปฏิเสธ")}>ปฏิเสธ</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="dropdown-wrapper">
          <button className="profile-circle-trigger" onClick={() => { setShowProfile(!showProfile); setShowNotify(false); }}>
            <div className="avatar-main">{displayName[0]}</div>
          </button>
          {showProfile && (
            <div className="dropdown-panel profile-panel-minimal">
              <div className="user-summary">
                <div className="avatar-box">{displayName[0]}</div>
                <div className="info">
                  <p className="name">{displayName}</p>
                  <p className="role">เจ้าหน้าที่ (Admin)</p>
                </div>
              </div>
              <div className="menu-group">
                <button className="menu-item" onClick={() => navigate("/user/menu")}>
                  <div className="icon-box blue"><User size={16} /></div>
                  <span>ระบบนิสิตช่วยงาน</span>
                  <ChevronRight size={14} className="arrow" />
                </button>
                <hr className="divider" />
                <button className="menu-item logout" onClick={() => { localStorage.clear(); window.location.href="/login"; }}>
                  <div className="icon-box red"><LogOut size={16} /></div>
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
