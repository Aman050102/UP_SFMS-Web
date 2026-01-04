import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/header.css";

interface HeaderProps {
  displayName: string;
  BACKEND: string;
}

export const HeaderUser: React.FC<HeaderProps> = ({ displayName, BACKEND }) => {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="brand" onClick={() => navigate("/")} style={{cursor: 'pointer'}}>
        <img src="/img/logoDSASMART.png" alt="Logo" className="brand-logo" />
      </div>

      <nav className="mainmenu">
        <ul>
          <li><a className="toplink" href="/user/menu">หน้าหลัก</a></li>
          <li><a className="toplink" href="/equipment">ยืมอุปกรณ์</a></li>
          <li><a className="toplink" href="/history">ประวัติการใช้งาน</a></li>
        </ul>
      </nav>

      <div className="righttools">
        <div className="user-display">
          <span>{displayName}</span>
        </div>
        <form action={`${BACKEND}/logout/`} method="post">
          <button type="submit" className="logout-btn">Logout</button>
        </form>
      </div>
    </header>
  );
};
