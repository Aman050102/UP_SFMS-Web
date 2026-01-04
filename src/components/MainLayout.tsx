import React from "react";
import { Outlet } from "react-router-dom";
import HeaderUser from "./HeaderUser"; // ไฟล์ Header ที่สร้างไว้
import HeaderStaff from "./HeaderStaff"; // ไฟล์ Header ที่สร้างไว้

interface Props {
  role: "user" | "staff";
}

export default function MainLayout({ role }: Props) {
  // ดึงข้อมูลจาก Context หรือ LocalStorage (ตัวอย่าง)
  const displayName = "นายบัสซาม แฮมา";
  const BACKEND = "https://dsa.up.ac.th";

  return (
    <div className="app-layout">
      {/* เลือก Header ตาม Role */}
      {role === "staff" ? (
        <HeaderStaff displayName={displayName} BACKEND={BACKEND} />
      ) : (
        <HeaderUser displayName={displayName} BACKEND={BACKEND} />
      )}

      {/* ส่วนเนื้อหาจากแต่ละ Page จะมาโผล่ตรง Outlet นี้ */}
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}
