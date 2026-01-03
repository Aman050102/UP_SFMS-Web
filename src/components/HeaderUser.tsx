import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/header.css";

export default function HeaderUser({ displayName, BACKEND }) {
  const [open, setOpen] = useState(false);
  const menuHostRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuHostRef.current) return;
      if (!menuHostRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const goCheckin = (e) => {
    e.preventDefault();
    navigate("/checkin");
  };

  return (
    <header className="topbar">
      <div className="brand">
        <img src="/img/logoDSASMART.png" alt="DSA" className="brand-logo" />
      </div>

      <nav className="mainmenu" aria-label="เมนูหลัก">
        <ul>
          <li><a className="toplink" href="/user/menu">หน้าหลัก</a></li>
          <li className={`has-sub ${open ? "open" : ""}`} ref={menuHostRef}>
            <a
              className="toplink"
              href="#"
              onClick={(e) => { e.preventDefault(); setOpen(v => !v); }}
            >
              บริการ
              <svg className="caret" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </a>
            <ul className="submenu" role="menu" aria-label="submenu">
              <li><a role="menuitem" href="#" onClick={goCheckin}>เช็คอินเข้าสนาม</a></li>
              <li><a role="menuitem" href="/equipment">ยืม-คืนอุปกรณ์กีฬา</a></li>
            </ul>
          </li>
        </ul>
      </nav>

      <div className="righttools">
        <span className="user-btn" aria-label="ผู้ใช้ปัจจุบัน">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round"
               strokeLinejoin="round" aria-hidden="true">
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          {displayName}
        </span>

        <form action={`${BACKEND}/logout/`} method="post" className="logout-form">
          <button type="submit" className="logout" title="ออกจากระบบ" aria-label="ออกจากระบบ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                 strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            ออกจากระบบ
          </button>
        </form>
      </div>
    </header>
  );
}