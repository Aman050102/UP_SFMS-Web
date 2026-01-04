import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/menu.css";
import "../../styles/tiles.css";

export default function UserMenu() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    setDisplayName(localStorage.getItem("display_name") || "นิสิตช่วยงาน");
  }, []);

  return (
    <div className="menu-container">
      <div className="section-title">เมนูหลักสำหรับ {displayName}</div>
      <section className="grid">
        <div className="tile" onClick={() => navigate("/checkin")}>
          <b>Check-in สนาม</b>
        </div>
        <div className="tile" onClick={() => navigate("/equipment")}>
          <b>ยืม-คืนอุปกรณ์</b>
        </div>
      </section>
    </div>
  );
}
