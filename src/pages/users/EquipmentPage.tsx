import React, { useEffect, useMemo, useState } from "react";
import "../../styles/equipment.css";

/* ===== helper ===== */
function getCookie(name: string): string | null {
  const v = `; ${document.cookie}`;
  const p = v.split(`; ${name}=`);
  if (p.length === 2) return p.pop()?.split(";").shift() || null;
  return null;
}

export default function EquipmentPage() {
  const BACKEND = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(
    /\/$/,
    ""
  );

  const BORROW_API = `${BACKEND}/api/equipment/borrow/`;
  const RETURN_API = `${BACKEND}/api/equipment/return/`;
  const STOCKS_API = `${BACKEND}/api/equipment/stock/`;
  const PENDING_RETURNS_API = `${BACKEND}/api/equipment/pending-returns/`;
  const FACULTY_CHECK_API = `${BACKEND}/api/equipment/faculty-from-student/`;

  const csrftoken = getCookie("csrftoken") || "";

  const [activeTab, setActiveTab] = useState("borrow");

  // ---------- Borrow state ----------
  const [equipments, setEquipments] = useState<any[]>([]);
  const [studentId, setStudentId] = useState("");
  const [faculty, setFaculty] = useState("");
  const [facultyLocked, setFacultyLocked] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [items, setItems] = useState([{ equip: "", qty: 1 }]);
  const [studentError, setStudentError] = useState("");
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [borrowError, setBorrowError] = useState("");
  const [showBorrowSheet, setShowBorrowSheet] = useState(false);

  // ---------- Return state ----------
  const [pendingRows, setPendingRows] = useState<any[]>([]);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState("");
  const [showReturnSheet, setShowReturnSheet] = useState(false);
  const [filterSid, setFilterSid] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // ---------- derived ----------
  const stockByName = useMemo(() => {
    const m: any = {};
    equipments.forEach((e) => {
      m[e.name] = e.stock ?? 0;
    });
    return m;
  }, [equipments]);

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const filteredRows = useMemo(() => {
    return pendingRows.filter((r) => {
      const sidOk = !filterSid || String(r.student_id || "").includes(filterSid);
      const dateOk = !filterDate || r.borrow_date === filterDate;
      return sidOk && dateOk;
    });
  }, [pendingRows, filterSid, filterDate]);

  const hasFilter = !!filterSid || !!filterDate;
  const noFilterResults = hasFilter && filteredRows.length === 0 && pendingRows.length > 0;

  // ---------- helper ----------
  async function fetchJSON(url: string, options = {}) {
    const resp = await fetch(url, options);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || data.ok === false) {
      const msg = data.message || data.error || `HTTP ${resp.status}`;
      throw new Error(msg);
    }
    return data;
  }

  function openSheet(setter: any) {
    setter(true);
    setTimeout(() => setter(false), 900);
  }

  // ---------- initial load ----------
  useEffect(() => {
    document.body.dataset.page = "equipment";
    try {
      const sid = localStorage.getItem("sfms_sid");
      const fac = localStorage.getItem("sfms_fac");
      const ph = localStorage.getItem("sfms_phone");
      if (sid) setStudentId(sid);
      if (fac) setFaculty(fac);
      if (ph) setPhone(ph);
    } catch { /* ignore */ }

    setFilterDate(todayISO);

    (async () => {
      try {
        const data = await fetchJSON(STOCKS_API, { credentials: "include" });
        setEquipments(data.equipments || []);
        if (data.equipments && data.equipments.length > 0) {
          setItems([{ equip: data.equipments[0].name, qty: 1 }]);
        }
      } catch (e) { console.warn("Load stock failed", e); }
    })();

    (async () => {
      setReturnLoading(true);
      try {
        const data = await fetchJSON(PENDING_RETURNS_API, { credentials: "include" });
        const rows = (data.rows || []).map((r: any, idx: number) => ({
          id: r.id ?? idx,
          student_id: r.student_id,
          faculty: r.faculty,
          phone: r.phone || "",
          equipment: r.equipment,
          borrowed: r.borrowed ?? r.quantity_borrowed ?? 0,
          pending: r.remaining ?? r.quantity_pending ?? 0,
          borrow_date: r.borrow_date || todayISO,
        }));
        setPendingRows(rows);
      } catch (e: any) {
        setReturnError(e.message || "โหลดรายการค้างคืนไม่สำเร็จ");
      } finally { setReturnLoading(false); }
    })();
  }, [BACKEND, STOCKS_API, PENDING_RETURNS_API, todayISO]);

  // ---------- handlers ----------
  async function handleCheckFaculty() {
    const sid = studentId.trim();
    if (!/^6\d{7}$/.test(sid)) { setFacultyLocked(false); return; }
    try {
      const url = `${FACULTY_CHECK_API}?student_id=${encodeURIComponent(sid)}`;
      const data = await fetchJSON(url, { credentials: "include" });
      if (data.faculty) { setFaculty(data.faculty); setFacultyLocked(true); }
      else { setFacultyLocked(false); }
    } catch { setFacultyLocked(false); }
  }

  function handleStudentChange(e: any) {
    const digits = (e.target.value || "").replace(/\D/g, "").slice(0, 8);
    setStudentId(digits);
    if (digits.length === 8 && !/^6\d{7}$/.test(digits)) setStudentError("ต้องขึ้นต้นด้วยเลข 6 และมีทั้งหมด 8 หลัก");
    else setStudentError("");
    if (digits.length === 0) setFacultyLocked(false);
  }

  function handlePhoneChange(e: any) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    if (digits.length > 0 && digits.length < 10) setPhoneError("เบอร์โทรไม่ถูกต้อง");
    else setPhoneError("");
  }

  function updateItemQty(idx: number, value: string) {
    let n = parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1) n = 1;
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], qty: n };
      return next;
    });
  }

  async function handleBorrow() {
    setBorrowError("");
    const sid = studentId.trim();
    const ph = phone.trim();

    if (!/^6\d{7}$/.test(sid)) { setBorrowError("รหัสนิสิตไม่ถูกต้อง"); return; }
    if (ph.length !== 10) { setBorrowError("กรุณากรอกเบอร์โทร 10 หลัก"); return; }

    setBorrowLoading(true);
    try {
      for (const it of items) {
        await fetchJSON(BORROW_API, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
          body: JSON.stringify({ equipment: it.equip, qty: it.qty, student_id: sid, faculty, phone: ph }),
        });
      }
      openSheet(setShowBorrowSheet);
      setActiveTab("return");
    } catch (e: any) { setBorrowError(e.message); }
    finally { setBorrowLoading(false); }
  }

  async function handleReturn(row: any, qtyReturn: number) {
    try {
      await fetchJSON(RETURN_API, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
        body: JSON.stringify({ equipment: row.equipment, qty: qtyReturn, student_id: row.student_id, faculty: row.faculty, phone: row.phone }),
      });
      openSheet(setShowReturnSheet);
      // Update UI local state logic here...
      window.location.reload(); // ง่ายที่สุดเพื่อให้ Stock ตรงกับ DB
    } catch (e: any) { alert(e.message); }
  }

  return (
    <div className="equipment-container">
      <main className="wrap equipment-wrap">
        <div className="modebar">
          <button className={`mode ${activeTab === "borrow" ? "active" : ""}`} onClick={() => setActiveTab("borrow")}>ยืมอุปกรณ์</button>
          <button className={`mode ${activeTab === "return" ? "active" : ""}`} onClick={() => setActiveTab("return")}>คืนอุปกรณ์</button>
        </div>

        {activeTab === "borrow" ? (
          <section id="borrowSection" className="grid">
            <div className="panel stock-card">
              <div className="stock-head"><div>อุปกรณ์</div><div>คงเหลือ</div></div>
              <ul className="stock-list">
                {equipments.map((e) => <li key={e.name}><span>{e.name}</span><b>{e.stock}</b></li>)}
              </ul>
            </div>

            <form className="panel form-card" onSubmit={(e) => { e.preventDefault(); handleBorrow(); }}>
              <label className="field">
                <span className="field-label">รหัสนิสิต</span>
                <input className="input" maxLength={8} value={studentId} onChange={handleStudentChange} onBlur={handleCheckFaculty} />
                {studentError && <small className="field-error">{studentError}</small>}
              </label>

              <label className="field">
                <span className="field-label">คณะ</span>
                <select className="input" value={faculty} onChange={(e) => setFaculty(e.target.value)} disabled={facultyLocked}>
                  <option value="">เลือกคณะ</option>
                  <option value="คณะเทคโนโลยีสารสนเทศ">คณะเทคโนโลยีสารสนเทศ</option>
                  <option value="คณะพยาบาลศาสตร์">คณะพยาบาลศาสตร์</option>
                </select>
              </label>

              <label className="field">
                <span className="field-label">เบอร์โทร</span>
                <input className="input" maxLength={10} value={phone} onChange={handlePhoneChange} />
              </label>

              <div className="field">
                <span className="field-label">รายการอุปกรณ์</span>
                {items.map((it, idx) => (
                  <div key={idx} className="multi-row">
                    <select className="input" value={it.equip} onChange={(e) => {
                      const next = [...items]; next[idx].equip = e.target.value; setItems(next);
                    }}>
                      <option value="">เลือกอุปกรณ์</option>
                      {equipments.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
                    </select>
                    <input type="number" className="input" style={{width: '70px'}} value={it.qty} onChange={(e) => updateItemQty(idx, e.target.value)} />
                  </div>
                ))}
              </div>

              {borrowError && <p className="field-error">{borrowError}</p>}
              <button type="submit" className="confirm" disabled={borrowLoading}>
                {borrowLoading ? "กำลังประมวลผล..." : "ยืนยันการยืม"}
              </button>
            </form>
          </section>
        ) : (
          <section id="returnSection">
            <h2 className="headline">รายการค้างคืน</h2>
            <div className="table-container">
              <table className="table-return">
                <thead>
                  <tr>
                    <th>นิสิต</th><th>อุปกรณ์</th><th>ค้าง</th><th>คืน</th><th>ปุ่ม</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, idx) => (
                    <ReturnRow key={idx} row={row} onReturn={handleReturn} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Sheets */}
      {showBorrowSheet && <div className="sheet show"><div className="sheet-card">ยืมสำเร็จ ✔</div></div>}
      {showReturnSheet && <div className="sheet show"><div className="sheet-card">คืนสำเร็จ ✔</div></div>}
    </div>
  );
}

function ReturnRow({ row, onReturn }: any) {
  const [val, setVal] = useState(row.pending);
  return (
    <tr>
      <td>{row.student_id}</td>
      <td>{row.equipment}</td>
      <td>{row.pending}</td>
      <td>
        <input type="number" value={val} onChange={(e) => setVal(parseInt(e.target.value))} style={{width: '60px'}} />
      </td>
      <td>
        <button className="btn-return" onClick={() => onReturn(row, val)}>คืน</button>
      </td>
    </tr>
  );
}
