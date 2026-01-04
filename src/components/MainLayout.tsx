import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import HeaderBase from "./HeaderBase";
import SidebarUser from "./SidebarUser"; // ลบ /sidebar/ ออก
import SidebarStaff from "./SidebarStaff"; // ลบ /sidebar/ ออกและใช้ชื่อไฟล์ให้ตรง

export default function MainLayout({ role }: { role: "user" | "staff" }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const displayName = localStorage.getItem("display_name") || "ผู้ใช้งาน";
  const BACKEND = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="app-layout">
      {/* Header สไตล์ YouTube */}
      <HeaderBase
        onToggleMenu={toggleMenu}
        displayName={displayName}
        BACKEND={BACKEND}
      />

      {/* Sidebar เมนูด้านซ้าย */}
      {role === "staff" ? (
        <SidebarStaff open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      ) : (
        <SidebarUser open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      )}

      {/* ส่วนเนื้อหาหลัก */}
      <main className="content-area" style={{ paddingTop: "70px", minHeight: "100vh", background: "#f0f0f0" }}>
        <Outlet />
      </main>
    </div>
  );
}
