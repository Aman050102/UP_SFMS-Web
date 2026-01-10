import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Plus, Minus, Trash2, Edit3, Save, X } from "lucide-react";
import HeaderStaff from "../../components/HeaderStaff";
import "../../styles/equipment.css"; // ใช้ CSS ตัวเดียวกับหน้ายืมคืนเพื่อให้สไตล์เหมือนกัน

const API = (import.meta.env.VITE_API_BASE_URL || "https://up-fms-api-hono.aman02012548.workers.dev").replace(/\/$/, "");

export default function StaffEquipmentManagePage() {
  const [displayName] = useState(localStorage.getItem("display_name") || "เจ้าหน้าที่");
  const [items, setItems] = useState<any[]>([]);
  const [equipName, setEquipName] = useState("");
  const [equipStock, setEquipStock] = useState("10");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    try {
      const res = await fetch(`${API}/api/equipment/stock/`);
      const data = await res.json();
      if (data.ok) setItems(data.equipments);
    } catch (e) { console.error("Load failed"); }
  };

  useEffect(() => { fetchList(); }, []);

  const handleSave = async () => {
  if (!equipName) return alert("กรุณาระบุชื่ออุปกรณ์");
  setLoading(true);
  try {
    const method = editingId ? "PATCH" : "POST";
    // ปรับ URL ให้ตรงกับ Backend API (ตัด /0/ ออกสำหรับ POST)
    const url = editingId
      ? `${API}/api/staff/equipment/${editingId}/`
      : `${API}/api/staff/equipment/`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: equipName,
        stock: parseInt(equipStock),
        total: parseInt(equipStock)
      })
    });

    if (res.ok) {
      setEquipName(""); setEquipStock("10"); setEditingId(null);
      fetchList(); // โหลดรายการใหม่
    } else {
      const data = await res.json();
      alert(data.error || "บันทึกไม่สำเร็จ");
    }
  } catch (e) {
    alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
  } finally { setLoading(false); }
};
  const deleteItem = async (id: number) => {
    if (!confirm("ยืนยันการลบอุปกรณ์นี้?")) return;
    await fetch(`${API}/api/staff/equipment/${id}/`, { method: "DELETE" });
    fetchList();
  };

  return (
    <div className="equipment-container">
      <HeaderStaff displayName={displayName} BACKEND={API} />

      <nav className="tab-header" style={{ marginTop: '20px' }}>
        <Link to="/staff/equipment" className="active" style={{ textDecoration: 'none', color: 'inherit' }}>
            <button className="active">จัดการอุปกรณ์</button>
        </Link>
        <Link to="/staff/borrow-ledger" style={{ textDecoration: 'none', color: 'inherit' }}>
            <button>บันทึกการยืม-คืน</button>
        </Link>
      </nav>

      <div className="borrow-vertical-flow">
        {/* ส่วนเพิ่ม/แก้ไขอุปกรณ์ */}
        <section className="panel info-section">
          <h4 className="title-sm">
            {editingId ? <Edit3 size={18} /> : <Plus size={18} />}
            {editingId ? "แก้ไขข้อมูลอุปกรณ์" : "เพิ่มอุปกรณ์ใหม่เข้าระบบ"}
          </h4>
          <div className="borrow-form-inputs">
            <div className="input-row">
              <div className="field-group">
                <label>ชื่ออุปกรณ์</label>
                <input value={equipName} onChange={e => setEquipName(e.target.value)} placeholder="เช่น ลูกบาสเกตบอล" />
              </div>
              <div className="field-group">
                <label>จำนวนสต็อกทั้งหมด</label>
                <input type="number" value={equipStock} onChange={e => setEquipStock(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button className="submit-btn-large" onClick={handleSave} disabled={loading} style={{ flex: 2 }}>
                    {editingId ? "บันทึกการแก้ไข" : "เพิ่มเข้าคลังอุปกรณ์"}
                </button>
                {editingId && (
                    <button className="submit-btn-large" onClick={() => {setEditingId(null); setEquipName("");}} style={{ flex: 1, background: '#666' }}>
                        ยกเลิก
                    </button>
                )}
            </div>
          </div>
        </section>

        {/* ตารางแสดงรายการ */}
        <section className="panel stock-section">
          <h4 className="title-sm"><Package size={18} /> รายการอุปกรณ์ในคลังปัจจุบัน</h4>
          <div className="stock-grid-minimal">
            {items.map(item => (
              <div key={item.id} className="stock-card-mini" style={{ height: 'auto', padding: '15px' }}>
                <div className="info-with-icon">
                  <div className="txt">
                    <strong style={{ fontSize: '16px' }}>{item.name}</strong>
                    <small>คงเหลือ: {item.stock} / ทั้งหมด: {item.total}</small>
                  </div>
                </div>
                <div className="actions" style={{ display: 'flex', gap: '8px' }}>
                  <button className="q-btn" onClick={() => {
                    setEditingId(item.id); setEquipName(item.name); setEquipStock(item.total.toString());
                  }} title="แก้ไข"><Edit3 size={14}/></button>
                  <button className="q-btn" onClick={() => deleteItem(item.id)} style={{ color: 'red' }} title="ลบ"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
