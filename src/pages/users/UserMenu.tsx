import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Trophy, MessageSquareText } from "lucide-react";
import "../../styles/menu.css";

export default function UserMenu() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    setDisplayName(localStorage.getItem("display_name") || "นิสิตช่วยงาน");
  }, []);

  return (
    <div className="menu-container">

      <section className="grid">
        <div className="tile" onClick={() => navigate("/checkin")}>
          <div className="tile-inner">
            <CheckCircle size={80} strokeWidth={2.5} color="#5f5aa2" />
            <b>Check-in สนาม</b>
            <small>บันทึกการเข้าใช้งานสนาม</small>
          </div>
        </div>

        <div className="tile" onClick={() => navigate("/equipment")}>
          <div className="tile-inner">
            <Trophy size={80} strokeWidth={2.5} color="#5f5aa2" />
            <b>ยืม-คืนอุปกรณ์</b>
            <small>จัดการรายการอุปกรณ์กีฬา</small>
          </div>
        </div>

        {/* เมนูแบบประเมินที่เพิ่มใหม่ */}
        <div className="tile" onClick={() => navigate("/checkin_feedback")}>
          <div className="tile-inner">
            <MessageSquareText size={80} strokeWidth={2.5} color="#ec4899" />
            <b>แบบประเมิน</b>
            <small>แบบฟอร์มแสดงความคิดเห็น</small>
          </div>
        </div>
      </section>
    </div>
  );
}
