import React from "react";
import { Link } from "react-router-dom";

type StaffMenuProps = {
  displayName: string;
  onLogout: () => void;
};

const StaffMenu: React.FC<StaffMenuProps> = ({ displayName, onLogout }) => {
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <img
            src="/static/img/logoDSASMART.png"
            alt="DSA"
            className="brand-logo"
          />
        </div>

        <nav className="mainmenu" aria-label="เมนูหลัก">
          <ul>
            <li>
              <Link className="toplink" to="/staff">
                หน้าหลัก
              </Link>
            </li>

            <li className="has-sub">
              <span className="toplink">
                จัดการข้อมูล
                <svg className="caret" viewBox="0 0 24 24">
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <ul className="submenu">
                <li>
                  <Link to="/staff/equipment">ยืม-คืนอุปกรณ์กีฬา</Link>
                </li>
                <li>
                  <Link to="/staff/badminton-booking">
                    จองสนามแบดมินตัน
                  </Link>
                </li>
              </ul>
            </li>

            <li className="has-sub">
              <span className="toplink">
                รายงาน
                <svg className="caret" viewBox="0 0 24 24">
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <ul className="submenu">
                <li>
                  <Link to="/report/checkin">ข้อมูลการเข้าใช้สนาม</Link>
                </li>
                <li>
                  <Link to="/report/borrow-stats">
                    ข้อมูลสถิติการยืม-คืน
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </nav>

        <div className="righttools">
          <span className="user-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {displayName}
          </span>

          <button className="logout" onClick={onLogout}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main>
        <div className="section-title">เมนูหลักสำหรับเจ้าหน้าที่</div>

        <section className="grid">
          <Link className="tile" to="/report/checkin">
            <div className="tile-inner">
              <b>ข้อมูลการเข้าใช้สนาม</b>
              <small>ดู/ค้นหา/ดาวน์โหลด</small>
            </div>
          </Link>

          <Link className="tile" to="/report/borrow-stats">
            <div className="tile-inner">
              <b>ข้อมูลสถิติการยืม-คืน</b>
              <small>สรุปยอด/แนวโน้ม</small>
            </div>
          </Link>

          <Link className="tile" to="/staff/equipment">
            <div className="tile-inner">
              <b>ยืม-คืน อุปกรณ์กีฬา</b>
              <small>จัดการรายการ/สต็อก</small>
            </div>
          </Link>

          <Link className="tile" to="/staff/badminton-booking">
            <div className="tile-inner">
              <b>จองสนามแบดมินตัน</b>
              <small>บริหารคอร์ท</small>
            </div>
          </Link>
        </section>
      </main>
    </>
  );
};

export default StaffMenu;
