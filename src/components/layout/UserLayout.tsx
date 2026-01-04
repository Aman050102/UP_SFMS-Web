import { ReactNode } from "react";
import HeaderUser from "../header/HeaderUser";
import "../../styles/layout.css";

export default function UserLayout({
  children,
}: {
  children: ReactNode;
}) {
  const displayName =
    window.CURRENT_USER ||
    localStorage.getItem("display_name") ||
    "ผู้ใช้งาน";

  return (
    <>
      <HeaderUser displayName={displayName} />
      <main className="page-wrap">{children}</main>
    </>
  );
}
