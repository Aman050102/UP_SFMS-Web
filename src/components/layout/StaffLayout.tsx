import { ReactNode } from "react";
import HeaderStaff from "../header/HeaderStaff";
import "../../styles/layout.css";

export default function StaffLayout({
  children,
}: {
  children: ReactNode;
}) {
  const displayName =
    window.CURRENT_USER ||
    localStorage.getItem("display_name") ||
    "เจ้าหน้าที่";

  return (
    <>
      <HeaderStaff displayName={displayName} />
      <main className="page-wrap">{children}</main>
    </>
  );
}
