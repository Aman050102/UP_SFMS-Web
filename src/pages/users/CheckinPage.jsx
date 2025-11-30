// src/pages/EquipmentPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import HeaderUser from "../../components/HeaderUser";
import "../../styles/equipment.css";

function getCookie(name) {
  const v = `; ${document.cookie}`;
  const p = v.split(`; ${name}=`);
  return p.length === 2 ? p.pop().split(";").shift() : null;
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
  const displayName =
    window.CURRENT_USER || localStorage.getItem("display_name") || "ผู้ใช้งาน";

  const [activeTab, setActiveTab] = useState("borrow");

  // ---------- Borrow state ----------
  const [equipments, setEquipments] = useState([]); // [{name, stock}]
  const [studentId, setStudentId] = useState("");
  const [faculty, setFaculty] = useState("");
  const [facultyLocked, setFacultyLocked] = useState(false);
  const [phone, setPhone] = useState("");
  const [selectedEquip, setSelectedEquip] = useState("");
  const [qty, setQty] = useState("1");
  const [items, setItems] = useState([]); // [{equipment, qty}]
  const [studentError, setStudentError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [borrowError, setBorrowError] = useState("");
  const [showBorrowSheet, setShowBorrowSheet] = useState(false);

  // ---------- Return state ----------
  const [pendingRows, setPendingRows] = useState([]); // [{id?, student_id, faculty, phone, equipment, borrowed, pending, borrow_date}]
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState("");
  const [showReturnSheet, setShowReturnSheet] = useState(false);

  // filter
  const [filterSid, setFilterSid] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // ---------- derived ----------
  const stockByName = useMemo(() => {
    const m = {};
    equipments.forEach((e) => {
      m[e.name] = e.stock ?? 0;
    });
    return m;
  }, [equipments]);

  const todayISO = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );

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
  async function fetchJSON(url, options = {}) {
    const resp = await fetch(url, options);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || data.ok === false) {
      const msg = data.message || data.error || `HTTP ${resp.status}`;
      throw new Error(msg);
    }
    return data;
  }

  function openSheet(setter) {
    setter(true);
    setTimeout(() => setter(false), 900);
  }

  function clampQtyValue(v, min = 1) {
    let n = parseInt(v, 10);
    if (!Number.isFinite(n) || n < min) n = min;
    return String(n);
  }

  // ---------- initial load ----------
  useEffect(() => {
    document.body.dataset.page = "equipment";

    // โหลด sid / fac / phone จาก localStorage
    try {
      const sid = localStorage.getItem("sfms_sid");
      const fac = localStorage.getItem("sfms_fac");
      const tel = localStorage.getItem("sfms_phone");
      if (sid) setStudentId(sid);
      if (fac) setFaculty(fac);
      if (tel) setPhone(tel);
    } catch {
      // ignore
    }

    setFilterDate(todayISO);

    (async () => {
      // โหลด stock
      try {
        const data = await fetchJSON(STOCKS_API, {
          credentials: "include",
        });
        const list = data.equipments || data.items || [];
        setEquipments(list);
        if (list.length > 0) setSelectedEquip(list[0].name);
      } catch (e) {
        console.warn("Load stock failed", e);
      }

      // โหลด pending returns
      setReturnLoading(true);
      setReturnError("");
      try {
        const data = await fetchJSON(PENDING_RETURNS_API, {
          credentials: "include",
        });
        const rows = (data.rows || []).map((r, idx) => ({
          id: r.id ?? idx,
          student_id: r.student_id,
          faculty: r.faculty,
          phone: r.phone || r.contact_phone || "",
          equipment: r.equipment,
          borrowed: r.borrowed ?? r.quantity_borrowed ?? 0,
          pending: r.remaining ?? r.quantity_pending ?? 0,
          borrow_date: r.borrow_date || todayISO,
        }));
        setPendingRows(rows);
      } catch (e) {
        setReturnError(e.message || "โหลดรายการค้างคืนไม่สำเร็จ");
      } finally {
        setReturnLoading(false);
      }
    })();
  }, [BACKEND, STOCKS_API, PENDING_RETURNS_API, todayISO]);

  // ---------- faculty auto from student id ----------
  async function handleCheckFaculty() {
    const sid = studentId.trim();
    if (!/^6\d{7}$/.test(sid)) {
      setFacultyLocked(false);
      return;
    }
    try {
      const url = `${FACULTY_CHECK_API}?student_id=${encodeURIComponent(sid)}`;
      const data = await fetchJSON(url, { credentials: "include" });
      if (data.faculty) {
        setFaculty(data.faculty);
        setFacultyLocked(true);
      } else {
        setFacultyLocked(false);
      }
    } catch (e) {
      console.warn("FACULTY_CHECK failed", e);
      setFacultyLocked(false);
    }
  }

  // ---------- handlers (borrow) ----------
  function handleStudentChange(e) {
    const digits = (e.target.value || "").replace(/\D/g, "").slice(0, 8);
    setStudentId(digits);

    if (digits.length === 8 && !/^6\d{7}$/.test(digits)) {
      setStudentError("ต้องขึ้นต้นด้วยเลข 6 และมีทั้งหมด 8 หลัก");
    } else {
      setStudentError("");
    }
    if (digits.length === 0) {
      setFacultyLocked(false);
    }
  }

  function handlePhoneChange(e) {
    const digits = (e.target.value || "").replace(/\D/g, "").slice(0, 10);
    setPhone(digits);

    if (!digits) {
      setPhoneError("");
      return;
    }
    if (/^0\d{8,9}$/.test(digits)) {
      setPhoneError("");
    } else {
      setPhoneError("กรุณากรอกเบอร์โทร 9–10 หลัก ขึ้นต้นด้วย 0");
    }
  }

  function changeQty(delta) {
    let n = parseInt(qty, 10);
    if (!Number.isFinite(n) || n < 1) n = 1;
    n = n + delta;
    if (n < 1) n = 1;
    setQty(String(n));
  }

  function handleAddItem() {
    setBorrowError("");

    const eq = selectedEquip;
    let n = parseInt(qty, 10);
    if (!Number.isFinite(n) || n < 1) n = 1;

    if (!eq) {
      setBorrowError("กรุณาเลือกอุปกรณ์");
      return;
    }

    const currentStock = stockByName[eq] ?? 0;
    const alreadyInCart = items.find((i) => i.equipment === eq)?.qty || 0;
    if (n + alreadyInCart > currentStock) {
      setBorrowError("จำนวนที่เลือกเกินจำนวนคงเหลือ");
      return;
    }

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.equipment === eq);
      if (idx === -1) {
        return [...prev, { equipment: eq, qty: n }];
      }
      const copy = [...prev];
      copy[idx] = { ...copy[idx], qty: copy[idx].qty + n };
      return copy;
    });
  }

  function handleRemoveItem(equipment) {
    setItems((prev) => prev.filter((i) => i.equipment !== equipment));
  }

  async function handleBorrow() {
    setBorrowError("");

    const sid = studentId.trim();
    const fac = faculty.trim();
    const tel = phone.trim();

    if (!/^6\d{7}$/.test(sid)) {
      setBorrowError("รหัสนิสิตต้องเป็นตัวเลข 8 หลัก เริ่มด้วย 6");
      return;
    }
    if (!tel) {
      setBorrowError("กรุณากรอกเบอร์โทรศัพท์");
      return;
    }
    if (phoneError) {
      setBorrowError(phoneError);
      return;
    }

    let cart = items;
    // ถ้าผู้ใช้ยังไม่ได้กดเพิ่มรายการ แต่มีอุปกรณ์/จำนวนอยู่ ให้ auto เติมลง cart
    if (cart.length === 0 && selectedEquip) {
      const n = parseInt(qty, 10);
      if (!Number.isFinite(n) || n < 1) {
        setBorrowError("กรุณาระบุจำนวนที่ยืม");
        return;
      }
      cart = [{ equipment: selectedEquip, qty: n }];
    }

    if (cart.length === 0) {
      setBorrowError("กรุณาเพิ่มอุปกรณ์อย่างน้อย 1 รายการ");
      return;
    }

    // เช็ค stock รวมทั้ง cart ก่อนยิง API
    for (const item of cart) {
      const left = stockByName[item.equipment] ?? 0;
      if (left <= 0 || item.qty > left) {
        setBorrowError(`จำนวนที่ยืมเกินจำนวนคงเหลือของ ${item.equipment}`);
        return;
      }
    }

    try {
      localStorage.setItem("sfms_sid", sid);
      if (fac) localStorage.setItem("sfms_fac", fac);
      localStorage.setItem("sfms_phone", tel);
    } catch {
      // ignore
    }

    if (borrowLoading) return;
    setBorrowLoading(true);

    try {
      const payload = {
        student_id: sid,
        faculty: fac,
        phone: tel,
        // NOTE: backend ตอนนี้อาจรับแบบเดิม (equipment + qty)
        // ถ้าจะใช้หลายรายการจริง ๆ ให้ปรับ Django ให้ loop ผ่าน items แทน
        items: cart.map((i) => ({
          equipment: i.equipment,
          qty: i.qty,
        })),
      };

      await fetchJSON(BORROW_API, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(csrftoken ? { "X-CSRFToken": csrftoken } : {}),
        },
        body: JSON.stringify(payload),
      });

      // update stock ฝั่งหน้า
      setEquipments((prev) =>
        prev.map((item) => {
          const found = cart.find((c) => c.equipment === item.name);
          if (!found) return item;
          return {
            ...item,
            stock: Math.max(0, (item.stock ?? 0) - found.qty),
          };
        })
      );

      // overlay
      openSheet(setShowBorrowSheet);

      // clear cart และสลับไปหน้าคืน
      setItems([]);
      setActiveTab("return");

      // upsert pendingRows
      setPendingRows((prev) => {
        const rows = [...prev];
        cart.forEach((item) => {
          const idx = rows.findIndex(
            (r) =>
              r.student_id === sid &&
              r.equipment === item.equipment &&
              r.borrow_date === todayISO
          );
          if (idx === -1) {
            rows.push({
              id: `local-${Date.now()}-${item.equipment}`,
              student_id: sid,
              faculty: fac || "-",
              phone: tel,
              equipment: item.equipment,
              borrowed: item.qty,
              pending: item.qty,
              borrow_date: todayISO,
            });
          } else {
            const r = rows[idx];
            rows[idx] = {
              ...r,
              borrowed: (r.borrowed || 0) + item.qty,
              pending: (r.pending || 0) + item.qty,
              phone: tel || r.phone,
            };
          }
        });
        return rows;
      });
    } catch (e) {
      setBorrowError(e.message || "ไม่สามารถทำรายการยืมได้");
    } finally {
      setBorrowLoading(false);
    }
  }

  // ---------- handlers (return) ----------
  async function handleReturn(row, qtyReturn) {
    if (!qtyReturn || qtyReturn < 1) return;

    try {
      const payload = {
        student_id: row.student_id,
        faculty: row.faculty,
        phone: row.phone,
        equipment: row.equipment,
        qty: qtyReturn,
      };

      await fetchJSON(RETURN_API, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(csrftoken ? { "X-CSRFToken": csrftoken } : {}),
        },
        body: JSON.stringify(payload),
      });

      openSheet(setShowReturnSheet);

      setPendingRows((prev) => {
        const rows = prev.map((r) => ({ ...r }));
        const idx = rows.findIndex((r) => r.id === row.id);
        if (idx === -1) return prev;
        const target = rows[idx];
        const newPending = Math.max(0, (target.pending || 0) - qtyReturn);
        target.pending = newPending;
        if (newPending <= 0) {
          rows.splice(idx, 1);
        }
        return rows;
      });

      // เพิ่ม stock กลับให้ item นั้น
      setEquipments((prev) =>
        prev.map((item) =>
          item.name === row.equipment
            ? { ...item, stock: (item.stock ?? 0) + qtyReturn }
            : item
        )
      );
    } catch (e) {
      alert(e.message || "คืนอุปกรณ์ไม่สำเร็จ");
    }
  }

  // ---------- render ----------
  return (
    <div className="equipment-page" data-page="equipment">
      <HeaderUser displayName={displayName} BACKEND={BACKEND} />

      <main className="equipment-wrap">
        {/* Mode bar */}
        <div className="modebar" role="tablist" aria-label="โหมด">
          <button
            type="button"
            className={`mode ${activeTab === "borrow" ? "active" : ""}`}
            aria-selected={activeTab === "borrow" ? "true" : "false"}
            onClick={() => setActiveTab("borrow")}
          >
            ยืมอุปกรณ์
          </button>
          <button
            type="button"
            className={`mode ${activeTab === "return" ? "active" : ""}`}
            aria-selected={activeTab === "return" ? "true" : "false"}
            onClick={() => setActiveTab("return")}
          >
            คืนอุปกรณ์
          </button>
        </div>

        {/* ---------- Borrow section ---------- */}
        {activeTab === "borrow" && (
          <section id="borrowSection" className="grid">
            {/* card form borrow */}
            <form
              className="panel form-card"
              onSubmit={(e) => {
                e.preventDefault();
                handleBorrow();
              }}
              noValidate
            >
              <h2 className="panel-title">ข้อมูลการยืม</h2>

              <div className="form-grid">
                <label className="field">
                  <span className="field-label">รหัสนิสิต</span>
                  <input
                    id="studentId"
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="6XXXXXXX"
                    className="input"
                    aria-describedby="studentError"
                    value={studentId}
                    onChange={handleStudentChange}
                    onBlur={handleCheckFaculty}
                  />
                  {studentError && (
                    <small id="studentError" className="field-error">
                      {studentError}
                    </small>
                  )}
                </label>

                <label className="field">
                  <span className="field-label">เบอร์โทรศัพท์</span>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="0XXXXXXXXX"
                    className="input"
                    value={phone}
                    onChange={handlePhoneChange}
                  />
                  {phoneError && (
                    <small className="field-error">{phoneError}</small>
                  )}
                </label>

                <label className="field">
                  <span className="field-label">คณะ</span>
                  <div className="select-wrap">
                    <select
                      id="faculty"
                      value={faculty}
                      onChange={(e) => setFaculty(e.target.value)}
                      disabled={facultyLocked}
                    >
                      <option value="">เลือกคณะ</option>
                      <option value="คณะเทคโนโลยีสารสนเทศ">
                        คณะเทคโนโลยีสารสนเทศ
                      </option>
                      <option value="คณะพยาบาลศาสตร์">คณะพยาบาลศาสตร์</option>
                      <option value="คณะอื่น ๆ">คณะอื่น ๆ</option>
                    </select>
                    <svg className="caret" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M6 9l6 6 6-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </label>
              </div>

              <div className="divider-row" />

              <div className="form-grid">
                <label className="field">
                  <span className="field-label">อุปกรณ์</span>
                  <div className="select-wrap">
                    <select
                      id="equipment"
                      value={selectedEquip}
                      onChange={(e) => setSelectedEquip(e.target.value)}
                    >
                      {equipments.length === 0 ? (
                        <option disabled>ยังไม่มีข้อมูลอุปกรณ์</option>
                      ) : (
                        equipments.map((e) => (
                          <option key={e.name} value={e.name}>
                            {e.name} (คงเหลือ {e.stock ?? 0})
                          </option>
                        ))
                      )}
                    </select>
                    <svg className="caret" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M6 9l6 6 6-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </label>

                <label className="field">
                  <span className="field-label">จำนวน</span>
                  <div className="qty">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => changeQty(-1)}
                    >
                      −
                    </button>
                    <input
                      id="qty"
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => setQty(clampQtyValue(e.target.value))}
                    />
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => changeQty(1)}
                    >
                      +
                    </button>
                  </div>
                </label>

                <div className="field field-inline-btn">
                  <span className="field-label">&nbsp;</span>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleAddItem}
                  >
                    เพิ่มลงในรายการ
                  </button>
                </div>
              </div>

              {borrowError && (
                <p className="hint error-text">
                  {borrowError}
                </p>
              )}

              {/* Summary cart */}
              <div className="borrow-summary">
                <div className="summary-header">
                  <span>รายการที่จะยืม</span>
                  <span className="summary-sub">
                    {items.length === 0 ? "ยังไม่มีรายการ" : `${items.length} รายการ`}
                  </span>
                </div>
                {items.length > 0 && (
                  <table className="summary-table">
                    <thead>
                      <tr>
                        <th>รายการ</th>
                        <th>จำนวน</th>
                        <th>คงเหลือหลังยืม (ประมาณ)</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const left = (stockByName[item.equipment] ?? 0) - item.qty;
                        return (
                          <tr key={item.equipment}>
                            <td className="summary-eq">{item.equipment}</td>
                            <td>{item.qty}</td>
                            <td>{left < 0 ? 0 : left}</td>
                            <td>
                              <button
                                type="button"
                                className="link-btn"
                                onClick={() => handleRemoveItem(item.equipment)}
                              >
                                ลบ
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                <p className="borrow-meta">
                  ผู้ยืม: <strong>{studentId || "-"}</strong>{" "}
                  {faculty ? `• ${faculty}` : ""}{" "}
                  {phone ? `• ${phone}` : ""}
                </p>
              </div>

              <div className="form-actions">
                <button
                  id="confirmBtn"
                  type="submit"
                  className="confirm"
                  disabled={borrowLoading}
                >
                  {borrowLoading ? "กำลังทำรายการ…" : "ยืนยันการยืม"}
                </button>
              </div>
            </form>

            {/* card stock */}
            <div className="panel stock-card">
              <h2 className="panel-title">สต็อกอุปกรณ์</h2>
              <div className="stock-head">
                <div>อุปกรณ์</div>
                <div>คงเหลือ</div>
              </div>
              <ul className="stock-list" aria-live="polite">
                {equipments.length === 0 ? (
                  <li>
                    <span>ยังไม่มีข้อมูลอุปกรณ์</span>
                    <b>0</b>
                  </li>
                ) : (
                  equipments.map((e) => (
                    <li key={e.name}>
                      <span>{e.name}</span>
                      <b>{(e.stock ?? 0).toLocaleString()}</b>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </section>
        )}

        {/* ---------- Return section ---------- */}
        {activeTab === "return" && (
          <section id="returnSection">
            <div className="return-header-row">
              <h1 className="headline">รายการอุปกรณ์ที่ค้างคืน</h1>
              <p className="headline-sub">
                กรองจากรหัสนิสิตหรือวันที่ยืม เพื่อค้นหารายการได้เร็วขึ้น
              </p>
            </div>

            <div className="toolbar">
              <label className="field sid">
                <span className="legend">รหัสนิสิต</span>
                <input
                  className="input"
                  type="text"
                  placeholder="พิมพ์รหัสนิสิต…"
                  value={filterSid}
                  onChange={(e) => setFilterSid(e.target.value)}
                />
              </label>

              <label className="field date">
                <span className="legend">วันที่ยืม</span>
                <input
                  className="input"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </label>

              <div className="btns">
                <button
                  type="button"
                  className="btn btn-green"
                  onClick={() => setFilterSid(filterSid.trim())}
                >
                  กรอง
                </button>
                <button
                  type="button"
                  className="btn btn-purple"
                  onClick={() => {
                    setFilterSid("");
                    setFilterDate("");
                  }}
                >
                  ล้างตัวกรอง
                </button>
              </div>
            </div>

            {returnError && (
              <p className="hint error-text">
                {returnError}
              </p>
            )}
            {returnLoading && (
              <p className="hint">กำลังโหลดรายการค้างคืน…</p>
            )}

            <div className="table-container">
              <table className="table-return" aria-label="ตารางคืนอุปกรณ์">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>รหัสนิสิต</th>
                    <th>คณะ</th>
                    <th>เบอร์โทร</th>
                    <th>รายการ</th>
                    <th>จำนวนที่ยืม</th>
                    <th>จำนวนค้างคืน</th>
                    <th>จำนวนที่จะคืน</th>
                    <th>คืน</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    pendingRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center" }}>
                          ยังไม่มีรายการค้างคืน
                        </td>
                      </tr>
                    ) : noFilterResults ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center" }}>
                          ไม่พบรายการที่ตรงกับเงื่อนไข
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center" }}>
                          ยังไม่มีรายการค้างคืน
                        </td>
                      </tr>
                    )
                  ) : (
                    filteredRows.map((row, idx) => (
                      <ReturnRow
                        key={row.id ?? `${row.student_id}-${row.equipment}-${idx}`}
                        index={idx + 1}
                        row={row}
                        onReturn={handleReturn}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Sheet borrow */}
      <div
        className="sheet"
        id="sheetBorrow"
        aria-hidden={showBorrowSheet ? "false" : "true"}
      >
        <div className="sheet-card">
          <div className="sheet-title">
            บันทึกการยืมเรียบร้อย
          </div>
          <div className="sheet-icon">✔</div>
        </div>
      </div>

      {/* Sheet return */}
      <div
        className="sheet"
        id="sheetReturn"
        aria-hidden={showReturnSheet ? "false" : "true"}
      >
        <div className="sheet-card">
          <div className="sheet-title">คืนอุปกรณ์เรียบร้อย</div>
          <div className="sheet-icon">✔</div>
        </div>
      </div>
    </div>
  );
}

function ReturnRow({ index, row, onReturn }) {
  const [val, setVal] = useState(String(row.pending || 1));

  const max = row.pending || 0;

  function handleClick() {
    let n = parseInt(val, 10);
    if (!Number.isFinite(n) || n < 1) n = 1;
    if (n > max) n = max;
    setVal(String(n));
    if (max <= 0) return;
    onReturn(row, n);
  }

  return (
    <tr>
      <td>{index}</td>
      <td>{row.student_id}</td>
      <td>{row.faculty || "-"}</td>
      <td>{row.phone || "-"}</td>
      <td>{row.equipment}</td>
      <td>{row.borrowed}</td>
      <td>{row.pending}</td>
      <td>
        <input
          type="number"
          min={1}
          max={max}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          style={{ width: "80px" }}
        />
      </td>
      <td>
        <button
          type="button"
          className="btn-return"
          disabled={max <= 0}
          onClick={handleClick}
        >
          คืน
        </button>
      </td>
    </tr>
  );
}
