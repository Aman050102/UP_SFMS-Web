
// src/pages/StaffMenu.jsx
import React, { useEffect, useState } from "react";
import "../../styles/global.css";
import "../../styles/header.css";
import "../../styles/menu.css";
import HeaderStaff from "../../components/HeaderStaff";

const BACKEND = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

// อ่านค่า CSRF จาก cookie
function getCookie(name) {
  const m = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

// ยิงไปเอา CSRF cookie มาก่อน (จำเป็นเวลา POST แบบมี SessionAuthentication)
async function primeCsrf() {
  try {
    await fetch(`${BACKEND}/auth/csrf/`, { credentials: "include" });
  } catch {}
}

export default function StaffMenu() {
  const [displayName, setDisplayName] = useState("กำลังโหลด...");

  // --- โหลดชื่อผู้ใช้จาก backend ---
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch(`${BACKEND}/auth/me/`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("not ok");
        const data = await res.json();
        if (data?.ok && data?.username) {
          setDisplayName(data.username);
          localStorage.setItem("display_name", data.username);
          // (ถ้าต้องเช็คบทบาท ก็ใช้ data.account_role === "staff")
        } else {
          // ยังไม่ล็อกอิน → ส่งกลับไปหน้าเข้าสู่ระบบฝั่ง staff
          window.location.href = "/login?role=staff";
        }
      } catch {
        window.location.href = "/login?role=staff";
      }
    };
    loadUser();
  }, []);

  // --- จัดการเปิด/ปิดซับเมนู ---
  useEffect(() => {
    const onClick = (e) => {
      const trigger = e.target.closest(".has-sub > .toplink");
      const groups = document.querySelectorAll(".has-sub");
      if (trigger) {
        e.preventDefault();
        const host = trigger.parentElement;
        const isOpen = host.classList.contains("open");
        groups.forEach((g) => g.classList.remove("open"));
        if (!isOpen) host.classList.add("open");
        return;
      }
      if (!e.target.closest(".has-sub")) {
        groups.forEach((g) => g.classList.remove("open"));
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // --- ออกจากระบบด้วย backend ---
  const onLogout = async (e) => {
    e.preventDefault();
    try {
      await primeCsrf();
      const csrftoken = getCookie("csrftoken");

      const res = await fetch(`${BACKEND}/logout/`, {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": csrftoken || "" },
      });

      let data = null;
      try {
        data = await res.json();
      } catch {}

      // หาก backend ส่ง next มา → ใช้เลย
      const nextUrl = data?.next || "/login?role=staff";
      window.location.href = nextUrl;
    } catch {
      window.location.href = "/login?role=staff";
    }
  };

  return (
    <div data-page="staff_menu">
      {/* ===== Header ===== */}
      <HeaderStaff displayName={displayName} BACKEND={BACKEND} />

      {/* ===== Content ===== */}
      <main>
        <div className="section-title">เมนูหลักสำหรับเจ้าหน้าที่</div>

        <section className="grid" aria-label="เมนูด่วน">
          <a className="tile" href="/checkin_report">
            <div className="tile-inner">
              <svg
                viewBox="0 0 24 24"
                width="48"
                height="48"
                aria-hidden="true"
              >
                <path
                  d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M14 2v4h4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="8"
                  y1="12"
                  x2="16"
                  y2="12"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="8"
                  y1="16"
                  x2="16"
                  y2="16"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <b>ข้อมูลการเข้าใช้สนาม</b>
              <small>ดู/ค้นหา/ดาวน์โหลด</small>
            </div>
          </a>

          <a className="tile" href="/staff_borrow_stats">
            <div className="tile-inner">
              <svg
                viewBox="0 0 24 24"
                width="48"
                height="48"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path d="M12 3a9 9 0 0 1 9 9h-9V3z" fill="currentColor" />
              </svg>
              <b>ข้อมูลสถิติการยืม-คืน</b>
              <small>สรุปยอด/แนวโน้ม</small>
            </div>
          </a>

          <a className="tile" href="/staff_equipment">
            <div className="tile-inner">
              <svg
                viewBox="0 0 24 24"
                width="48"
                height="48"
                aria-hidden="true"
              >
                <path
                  d="M3 7l9-4 9 4-9 4-9-4z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M3 7v10l9 4 9-4V7"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path d="M12 11v10" stroke="currentColor" strokeWidth="2" />
              </svg>
              <b>ยืม-คืน อุปกรณ์กีฬา</b>
              <small>จัดการรายการ/สต็อก</small>
            </div>
          </a>

          <a className="tile" href="/StaffEquipmentManagePage">
            <div className="tile-inner">
              <svg
                viewBox="0 0 24 24"
                width="48"
                height="48"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  ry="2"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <line
                  x1="16"
                  y1="2"
                  x2="16"
                  y2="6"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="8"
                  y1="2"
                  x2="8"
                  y2="6"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="3"
                  y1="10"
                  x2="21"
                  y2="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <b>จองสนามแบดมินตัน</b>
              <small>บริหารคอร์ท</small>
            </div>
          </a>
        </section>
      </main>

      <div className="footer-bar" />
    </div>
  );
}
