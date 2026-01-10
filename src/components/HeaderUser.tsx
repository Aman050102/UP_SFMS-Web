import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Home, ChevronRight } from "lucide-react";

export default function HeaderUser({ displayName, onToggleMenu }: any) {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="topbar">
      <div className="header-left">
        <button className="menu-toggle-btn" onClick={onToggleMenu}>
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <img src="/img/dsa.png" alt="Logo" className="brand-logo" onClick={() => navigate("/user/menu")} />
      </div>

      <div className="header-right">
        <div className="dropdown-wrapper">
          <button className="profile-circle-trigger" onClick={() => setShowProfile(!showProfile)}>
            <div className="avatar-main user-theme">{displayName[0]}</div>
          </button>

          {showProfile && (
            <div className="dropdown-panel profile-panel-minimal">
              <div className="user-summary">
                <div className="avatar-box user-theme">{displayName[0]}</div>
                <div className="info">
                  <p className="name">{displayName}</p>
                  <p className="role">นิสิตช่วยงาน</p>
                </div>
              </div>
              <div className="menu-group">
                <button className="menu-item" onClick={() => navigate("/user/menu")}>
                  <div className="icon-box gray"><Home size={16} /></div>
                  <span>หน้าแรก</span>
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
