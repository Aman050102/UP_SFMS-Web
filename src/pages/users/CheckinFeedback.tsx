import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, X } from "lucide-react";
import "../../styles/checkin_feedback.css";

const FACILITY_OPTIONS = [
  { k: "outdoor", name: "สนามกลางแจ้ง" },
  { k: "badminton", name: "สนามแบดมินตัน" },
  { k: "track", name: "สนามลู่-ลาน" },
  { k: "pool", name: "สระว่ายน้ำ" },
];

export default function CheckinFeedback() {
  const navigate = useNavigate();
  const [facility, setFacility] = useState("outdoor");
  const [problems, setProblems] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // จัดการการเลือกรูปภาพ
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview) {
      alert("กรุณาแนบรูปภาพใบลงทะเบียน");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      alert("ขอบคุณสำหรับความคิดเห็น");
      setLoading(false);
      navigate("/user/menu");
    }, 1500);
  };

  return (
    <div className="wrap" data-page="checkin-feedback">
      <main>
        <section className="fb-card">
          <div className="fb-header">
            <h1>แบบฟอร์มแสดงความคิดเห็น</h1>
            <p className="fb-subtitle">แสดงความคิดเห็นและแนบหลักฐานการใช้บริการสนามกีฬา</p>
          </div>

          <div className="fb-basic">
            <div className="fb-basic-row">
              <div className="fb-field">
                <label className="fb-label">เลือกสถานที่ที่ใช้งาน</label>
                <select
                  className="input-lg"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                >
                  {FACILITY_OPTIONS.map(opt => (
                    <option key={opt.k} value={opt.k}>{opt.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="fb-label">วันที่ดำเนินการ</span>
                <div className="fb-value">{todayStr}</div>
              </div>
            </div>
          </div>

          <form className="fb-form" onSubmit={onSubmit}>
            {/* ส่วนอัปโหลดรูปภาพใบลงทะเบียน (แทนที่การให้คะแนนดาว) */}
            <div className="fb-field">
              <label className="fb-label">ส่งรูปภาพใบลงทะเบียน (Proof of Registration)</label>

              {!imagePreview ? (
                <label className="fb-file-box" style={{ cursor: 'pointer', textAlign: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    hidden
                  />
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <Camera size={48} color="#muted" />
                    <span style={{ color: '#64748b', fontWeight: 600 }}>คลิกเพื่อถ่ายรูปหรือเลือกรูปภาพ</span>
                  </div>
                </label>
              ) : (
                <div className="fb-image-preview-container" style={{ position: 'relative', marginTop: '10px' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: '100%', borderRadius: '16px', maxHeight: '300px', objectFit: 'cover', border: '2px solid var(--divider)' }}
                  />
                  <button
                    type="button"
                    className="fb-remove-img"
                    onClick={() => setImagePreview(null)}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="fb-field">
              <label className="fb-label">ปัญหาที่พบหรือข้อเสนอแนะเพิ่มเติม</label>
              <textarea
                className="fb-textarea"
                placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)..."
                value={problems}
                onChange={e => setProblems(e.target.value)}
              />
            </div>

            <div className="fb-actions">
              <button
                type="submit"
                className="fb-btn-primary"
                disabled={loading || !imagePreview}
              >
                {loading ? "กำลังบันทึก..." : "ยืนยันการส่งข้อมูล"}
              </button>
              <button
                type="button"
                className="fb-btn-ghost"
                onClick={() => navigate("/user/menu")}
              >
                กลับหน้าหลัก
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
