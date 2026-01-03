import React, { useEffect, useState } from "react";
import "../../styles/global.css";
import "../../styles/header.css";
import "../../styles/menu.css";
import HeaderStaff from "../../components/HeaderStaff";

const BACKEND =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "";

// ===== Utils =====
const getCookie = (name: string): string => {
  const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : "";
};

const primeCsrf = async (): Promise<void> => {
  try {
    await fetch(`${BACKEND}/auth/csrf/`, { credentials: "include" });
  } catch {
    /* ignore */
  }
};

interface MeResponse {
  ok?: boolean;
  username?: string;
  account_role?: string;
}

// ===== Component =====
export default function StaffMenu(): JSX.Element {
  const [displayName, setDisplayName] = useState<string>("กำลังโหลด...");

  // โหลดข้อมูลผู้ใช้
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch(`${BACKEND}/auth/me/`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("not ok");

        const data: MeResponse = await res.json();
        if (data?.username) {
          setDisplayName(data.username);
          localStorage.setItem("display_name", data.username);
        } else {
          window.location.href = "/login?role=staff";
        }
      } catch {
        window.location.href = "/login?role=staff";
      }
    };

    loadUser();
  }, []);

  // dropdown behavior
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const trigger = target.closest(".has-sub > .toplink");
      const groups = document.querySelectorAll(".has-sub");

      if (trigger) {
        e.preventDefault();
        const parent = trigger.parentElement;
        const isOpen = parent?.classList.contains("open");
        groups.forEach((g) => g.classList.remove("open"));
        if (!isOpen) parent?.classList.add("open");
        return;
      }

      if (!target.closest(".has-sub")) {
        groups.forEach((g) => g.classList.remove("open"));
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // logout
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await primeCsrf();
      const res = await fetch(`${BACKEND}/logout/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      window.location.href = data?.next || "/login?role=staff";
    } catch {
      window.location.href = "/login?role=staff";
    }
  };

  return (
    <div data-page="staff_menu">
      <HeaderStaff displayName={displayName} BACKEND={BACKEND} />

      <main>
        <div className="section-title">เมนูหลักสำหรับเจ้าหน้าที่</div>

        <section className="grid" aria-label="เมนูหลัก">
          <a className="tile" href="/checkin_report">
            <div className="tile-inner">
              <b>ข้อมูลการเข้าใช้สนาม</b>
              <small>ดู / ค้นหา</small>
            </div>
          </a>

          <a className="tile" href="/staff_borrow_stats">
            <div className="tile-inner">
              <b>สถิติการยืม-คืน</b>
              <small>รายงานภาพรวม</small>
            </div>
          </a>

          <a className="tile" href="/staff_equipment">
            <div className="tile-inner">
              <b>จัดการอุปกรณ์กีฬา</b>
              <small>เพิ่ม / แก้ไข / ลบ</small>
            </div>
          </a>

          <a className="tile" href="/StaffEquipmentManagePage">
            <div className="tile-inner">
              <b>จัดการคลังอุปกรณ์</b>
              <small>ระบบสต็อก</small>
            </div>
          </a>
        </section>
      </main>

      <div className="footer-bar" />
    </div>
  );
}
