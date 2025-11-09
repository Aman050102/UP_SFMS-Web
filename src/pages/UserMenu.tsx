import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/global.css";
import "../styles/menu.css";
import HeaderUser from "../components/HeaderUser";

const BACKEND = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("กำลังโหลด...");
  // ถ้าไฟล์นี้เป็น .jsx ให้เปลี่ยนเป็น: const menuHostRef = useRef(null);
  const menuHostRef = useRef<HTMLLIElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND}/auth/me/`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data?.ok && data?.username) {
          setDisplayName(data.username);
          localStorage.setItem("display_name", data.username);
        } else {
          location.href = "/login?role=person";
        }
      } catch {
        location.href = "/login?role=person";
      }
    })();
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuHostRef.current) return;
      if (!menuHostRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const goCheckin = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    navigate("/checkin"); // ใช้พิมพ์เล็กให้หมด
  };

  return (
    <div data-page="user_menu">
      {/* ===== Header ===== */}
      <HeaderUser displayName={displayName} BACKEND={BACKEND} />

      {/* ===== Content ===== */}
      <main>
        <div className="section-title">เมนูหลักสำหรับนิสิตช่วยงาน</div>

        <section className="grid" aria-label="เมนูด่วน">
          <a className="tile" href="#" onClick={goCheckin}>
            <div className="tile-inner">
              {/* ไอคอนเดิม */}
              <b>Check in</b>
              <small>เช็คอินเข้าสนาม</small>
            </div>
          </a>

          <a className="tile" href="/equipment">
            <div className="tile-inner">
              <b>ยืม-คืน อุปกรณ์กีฬา</b>
              <small>บาส · ฟุตบอล · แบดมินตัน</small>
            </div>
          </a>
        </section>
      </main>

      <div className="footer-bar" />
    </div>
  );
}
