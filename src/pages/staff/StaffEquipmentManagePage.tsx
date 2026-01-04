import React, { useEffect, useState } from "react";
import "../../styles/staff-equipment.css";

const BACKEND =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";

const API_LIST = `${BACKEND}/api/staff/equipments/`;
const API_ITEM = (id: number) => `${BACKEND}/api/staff/equipment/${id}/`;

interface EquipmentItem { id: number; name: string; stock: number; total: number; }
interface ApiListResponse { rows?: EquipmentItem[]; data?: EquipmentItem[]; }
interface ApiResponse { ok?: boolean; message?: string; row?: EquipmentItem; }

const getCsrfToken = (): string => {
  const m = document.cookie.match(/(?:^|;)\s*csrftoken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
};

const clampInt = (n: unknown): number => {
  const num = Number(n);
  return Number.isFinite(num) ? Math.max(0, Math.floor(num)) : 0;
};

const normalize = (s: string) => s.trim().toLowerCase();

export default function StaffEquipmentManagePage() {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [equipName, setEquipName] = useState("");
  const [equipStock, setEquipStock] = useState("10");
  const [editingNameId, setEditingNameId] = useState<number | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");
  const [showSheet, setShowSheet] = useState(false);

  useEffect(() => {
    document.body.setAttribute("data-page", "staff-equipment");
    fetchList();
    return () => document.body.removeAttribute("data-page");
  }, []);

  const fetchList = async () => {
    try {
      const res = await fetch(API_LIST, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data: ApiListResponse = await res.json();
      setItems(data.rows || data.data || []);
    } catch { alert("โหลดรายการไม่สำเร็จ"); }
  };

  const openSheet = () => { setShowSheet(true); setTimeout(() => setShowSheet(false), 1200); };

  const handleAdd = async () => {
    const name = equipName.trim();
    const stock = clampInt(equipStock);
    if (!name) return alert("กรุณากรอกชื่ออุปกรณ์");
    const existed = items.find((i) => normalize(i.name) === normalize(name));
    try {
      if (existed) {
        const newStock = existed.stock + stock;
        await fetch(API_ITEM(existed.id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "X-CSRFToken": getCsrfToken() },
          credentials: "include",
          body: JSON.stringify({ stock: newStock, total: Math.max(newStock, existed.total) }),
        });
      } else {
        await fetch(API_ITEM(0), {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRFToken": getCsrfToken() },
          credentials: "include",
          body: JSON.stringify({ name, stock, total: stock }),
        });
      }
      setEquipName(""); setEquipStock("10"); openSheet(); fetchList();
    } catch { alert("บันทึกไม่สำเร็จ"); }
  };

  const updateRow = async (row: EquipmentItem) => {
    try {
      await fetch(API_ITEM(row.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCsrfToken() },
        credentials: "include",
        body: JSON.stringify({ name: row.name, stock: row.stock, total: Math.max(row.total, row.stock) }),
      });
      openSheet();
    } catch { alert("บันทึกไม่สำเร็จ"); }
  };

  const deleteRow = async (row: EquipmentItem) => {
    if (!confirm("ต้องการลบรายการนี้หรือไม่?")) return;
    try {
      const res = await fetch(API_ITEM(row.id), { method: "DELETE", headers: { "X-CSRFToken": getCsrfToken() }, credentials: "include" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== row.id));
      openSheet();
    } catch { alert("ลบไม่สำเร็จ"); }
  };

  return (
    <div data-page="staff-equipment">
      <main className="wrap staff-equipment-wrap">
        <nav className="mainmenu">
          <ul>
            <li><a className="tab active" href="/staff_equipment">✓ จัดการอุปกรณ์กีฬา</a></li>
            <li><a className="tab" href="/staff/borrow-ledger">บันทึกการยืม-คืน</a></li>
          </ul>
        </nav>
        <h1 className="page-title">เพิ่มและจัดการอุปกรณ์กีฬา</h1>
        <div className="add-row">
          <input className="input" placeholder="ชื่ออุปกรณ์" value={equipName} onChange={(e) => setEquipName(e.target.value)} />
          <input className="input" type="number" value={equipStock} onChange={(e) => setEquipStock(e.target.value)} />
          <button className="btn primary" onClick={handleAdd}>เพิ่ม</button>
        </div>
        <section className="panel">
          {items.length === 0 && <div className="empty">ยังไม่มีรายการอุปกรณ์</div>}
          {items.map((row) => (
            <div key={row.id} className="row">
              <div className="name">
                {editingNameId === row.id ? (
                  <input value={editingNameValue} onChange={(e) => setEditingNameValue(e.target.value)} onBlur={() => { setEditingNameId(null); updateRow({ ...row, name: editingNameValue }); }} autoFocus />
                ) : (
                  <span onDoubleClick={() => { setEditingNameId(row.id); setEditingNameValue(row.name); }}>{row.name}</span>
                )}
              </div>
              <div className="stock">
                <button onClick={() => setItems(prev => prev.map(i => i.id === row.id ? {...i, stock: Math.max(0, i.stock-1)} : i))}>−</button>
                <input type="number" value={row.stock} onChange={(e) => setItems(prev => prev.map(i => i.id === row.id ? {...i, stock: clampInt(e.target.value)} : i))} />
                <button onClick={() => setItems(prev => prev.map(i => i.id === row.id ? {...i, stock: i.stock+1} : i))}>+</button>
              </div>
              <div className="actions"><button onClick={() => updateRow(row)}>💾</button><button onClick={() => deleteRow(row)}>🗑️</button></div>
            </div>
          ))}
        </section>
      </main>
      <div className={`sheet ${showSheet ? "show" : ""}`}><div className="sheet-card"><div className="sheet-title">ดำเนินการสำเร็จ</div><div className="sheet-icon">✔</div></div></div>
    </div>
  );
}
