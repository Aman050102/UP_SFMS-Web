import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/header.css";

export default function HeaderStaff({ displayName, BACKEND }: any) {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="header-left">
        <button className="menu-toggle-btn" title="เมนูแอดมิน">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>
        <img
          src="/img/dsa.png"
          alt="Staff Logo"
          className="brand-logo"
          onClick={() => navigate("/staff/menu")}
        />
      </div>

      <nav className="header-center mainmenu">
        <ul>
          <li><a href="/staff/menu" className="toplink">หน้าแรก</a></li>
          <li><a href="/staff_equipment" className="toplink">จัดการอุปกรณ์</a></li>
          <li><a href="/staff/borrow-ledger" className="toplink">บันทึกยืม-คืน</a></li>
        </ul>
      </nav>

      <div className="header-right">
        <div className="user-info">
          <span className="user-name-text" style={{color: '#5f5aa2'}}>Admin: {displayName}</span>
        </div>
        <form action={`${BACKEND}/logout/`} method="post">
          <button type="submit" className="logout-btn" style={{background: '#333'}}>Logout</button>
        </form>
      </div>
    </header>
  );
}
