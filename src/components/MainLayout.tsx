import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import HeaderStaff from "./HeaderStaff";
import HeaderUser from "./HeaderUser";
import SidebarStaff from "./SidebarStaff";
import SidebarUser from "./SidebarUser";

export default function MainLayout({ role }: { role: "user" | "staff" }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const displayName = localStorage.getItem("display_name") || "ผู้ใช้งาน";
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="app-layout" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* เลือก Header ตาม Role */}
      {role === "staff" ? (
        <HeaderStaff onToggleMenu={toggleMenu} displayName={displayName} />
      ) : (
        <HeaderUser onToggleMenu={toggleMenu} displayName={displayName} />
      )}

      <div style={{ display: "flex", flex: 1, position: "relative" }}>
        {/* เลือก Sidebar ตาม Role */}
        {role === "staff" ? (
          <SidebarStaff open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        ) : (
          <SidebarUser open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        )}

        <main className="content-area" style={{ flex: 1, paddingTop: "80px", background: "#f8fafc", minHeight: "100vh" }}>
          <Outlet />
        </main>
      </div>

      {isMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1001 }} />
      )}
    </div>
  );
}
