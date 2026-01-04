import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/header.css";

export default function HeaderUser({ displayName, BACKEND }: any) {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="header-left">
        <button className="menu-toggle-btn" title="เมนู">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>
        <img
          src="/img/dsa.png"
          alt="Logo"
          className="brand-logo"
          onClick={() => navigate("/user/menu")}
        />
      </div>

      <nav className="header-center mainmenu">
        <ul>
          <li><a href="/user/menu" className="toplink">หน้าหลัก</a></li>
          <li><a href="/equipment" className="toplink">ยืม-คืนอุปกรณ์</a></li>
          <li><a href="/checkin" className="toplink">เช็คอินสนาม</a></li>
        </ul>
      </nav>

      <div className="header-right">
        <div className="user-info">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
          <span className="user-name-text">{displayName}</span>
        </div>
        <form action={`${BACKEND}/logout/`} method="post">
          <button type="submit" className="logout-btn">Logout</button>
        </form>
      </div>
    </header>
  );
}
