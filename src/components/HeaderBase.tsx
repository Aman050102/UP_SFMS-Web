import React from "react";
import "../styles/header.css";

export default function HeaderBase({ onToggleMenu, displayName, BACKEND }: any) {
  return (
    <header className="topbar">
      <div className="header-left">
        <button className="menu-toggle-btn" onClick={onToggleMenu} type="button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>
        <img src="/img/dsa.png" alt="Logo" className="brand-logo" />
      </div>
      <div className="header-right">
        <span className="user-name-text">{displayName}</span>
        <form action={`${BACKEND}/logout/`} method="post">
          <button type="submit" className="logout-btn">Logout</button>
        </form>
      </div>
    </header>
  );
}
