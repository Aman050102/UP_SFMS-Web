// src/pages/users/UserMenu.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../../components/layout/UserLayout";
import "../../styles/menu.css";

const BACKEND =
  (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export default function UserMenu() {
  const [displayName, setDisplayName] = useState("กำลังโหลด...");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BACKEND}/auth/me/`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.username) {
          setDisplayName(d.username);
          localStorage.setItem("display_name", d.username);
        } else {
          window.location.href = "/login?role=person";
        }
      })
      .catch(() => (window.location.href = "/login?role=person"));
  }, []);

  return (
    <UserLayout displayName={displayName}>
      <div className="section-title">เมนูหลักสำหรับนิสิตช่วยงาน</div>

      <section className="grid">
        <div className="tile" onClick={() => navigate("/checkin")}>
          <b>Check-in</b>
        </div>
        <div className="tile" onClick={() => navigate("/equipment")}>
          <b>ยืม-คืนอุปกรณ์</b>
        </div>
      </section>
    </UserLayout>
  );
}
