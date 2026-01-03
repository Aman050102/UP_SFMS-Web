// src/pages/users/EquipmentPage.tsx
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
  const [phoneError, setPhoneError] = useState("");

  // หลายรายการ: [{ equip, qty }]
  const [items, setItems] = useState([{ equip: "", qty: 1 }]);

  const [studentError, setStudentError] = useState("");
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

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const filteredRows = useMemo(() => {
    return pendingRows.filter((r) => {
      const sidOk = !filterSid || String(r.student_id || "").includes(filterSid);
      const dateOk = !filterDate || r.borrow_date === filterDate;
      return sidOk && dateOk;
    });
  }, [pendingRows, filterSid, filterDate]);

  const hasFilter = !!filterSid || !!filterDate;
  const noFilterResults =
    hasFilter && filteredRows.length === 0 && pendingRows.length > 0;

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

  // ---------- initial load ----------
  useEffect(() => {
    document.body.dataset.page = "equipment";

    // โหลด sid/fac/phone จาก localStorage
    try {
      const sid = localStorage.getItem("sfms_sid");
      const fac = localStorage.getItem("sfms_fac");
      const ph = localStorage.getItem("sfms_phone");
      if (sid) setStudentId(sid);
      if (fac) setFaculty(fac);
      if (ph) setPhone(ph);
    } catch {
      // ignore
    }

    setFilterDate(todayISO);

    // โหลด equipment list (stock)
    (async () => {
      try {
        const data = await fetchJSON(STOCKS_API, {
          credentials: "include",
        });
        setEquipments(data.equipments || []);
        // default ให้แถวแรกเลือกอุปกรณ์ตัวแรก
        if (data.equipments && data.equipments.length > 0) {
          setItems([{ equip: data.equipments[0].name, qty: 1 }]);
        }
      } catch (e) {
        console.warn("Load stock failed", e);
      }
    })();

    // โหลด pending returns
    (async () => {
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
          phone: r.phone || "",
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

  // ---------- borrow handlers ----------
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
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    if (digits.length > 0 && digits.length < 10) {
      setPhoneError("เบอร์โทรไม่ถูกต้อง (ต้อง 10 หลัก)");
    } else {
      setPhoneError("");
    }
  }

  function updateItemEquip(idx, value) {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], equip: value };
      return next;
    });
  }

  function updateItemQty(idx, value) {
    let n = parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1) n = 1;
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], qty: n };
      return next;
    });
  }

  function addItemRow() {
    setItems((prev) => [...prev, { equip: "", qty: 1 }]);
  }

  function removeItemRow(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleBorrow() {
    setBorrowError("");

    const sid = studentId.trim();
    const fac = faculty.trim();
    const ph = phone.trim();

    if (!/^6\d{7}$/.test(sid)) {
      setBorrowError("รหัสนิสิตต้องเป็นตัวเลข 8 หลัก เริ่มด้วย 6");
      return;
    }

    if (!ph || ph.length !== 10) {
      setBorrowError("กรุณากรอกเบอร์โทร 10 หลัก");
      return;
    }

    if (!items.length) {
      setBorrowError("กรุณาเพิ่มรายการอุปกรณ์ที่ต้องการยืม");
      return;
    }

    // validate items
    if (items.some((i) => !i.equip)) {
      setBorrowError("กรุณาเลือกอุปกรณ์ให้ครบทุกแถว");
      return;
    }
    if (items.some((i) => !i.qty || i.qty < 1)) {
      setBorrowError("จำนวนขั้นต่ำ 1 ชิ้นต่อรายการ");
      return;
    }

    // ตรวจสต็อกรวมต่ออุปกรณ์ (หลายแถวอาจเลือกชนิดเดียวกัน)
    const sumByEquip = {};
    for (const it of items) {
      sumByEquip[it.equip] = (sumByEquip[it.equip] || 0) + it.qty;
    }
    for (const [eq, totalQty] of Object.entries(sumByEquip)) {
      const left = stockByName[eq] ?? 0;
      if (left < totalQty) {
        setBorrowError(`อุปกรณ์ "${eq}" มีไม่พอ (คงเหลือ ${left} ชิ้น)`);
        return;
      }
    }

    // เก็บ sid/fac/phone ลง localStorage
    try {
      localStorage.setItem("sfms_sid", sid);
      if (fac) localStorage.setItem("sfms_fac", fac);
      if (ph) localStorage.setItem("sfms_phone", ph);
    } catch {
      // ignore
    }

    if (borrowLoading) return;
    setBorrowLoading(true);

    try {
      // เรียก API เดิมทีละรายการ ให้ backend ทำงานเหมือนเดิม
      for (const it of items) {
        const payload = {
          equipment: it.equip,
          qty: it.qty,
          student_id: sid,
          faculty: fac,
          phone: ph,
        };

        const data = await fetchJSON(BORROW_API, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...(csrftoken ? { "X-CSRFToken": csrftoken } : {}),
          },
          body: JSON.stringify(payload),
        });

        const newStock =
          typeof data.stock === "number"
            ? data.stock
            : Math.max(0, (stockByName[it.equip] ?? 0) - it.qty);

        // update stock ฝั่ง UI
        setEquipments((prev) =>
          prev.map((item) =>
            item.name === it.equip ? { ...item, stock: newStock } : item
          )
        );

        // upsert pending row ต่ออุปกรณ์
        setPendingRows((prev) => {
          const rows = [...prev];
          const idx = rows.findIndex(
            (r) => r.student_id === sid && r.equipment === it.equip
          );
          if (idx === -1) {
            rows.push({
              id: `local-${Date.now()}-${it.equip}`,
              student_id: sid,
              faculty: fac || "-",
              phone: ph,
              equipment: it.equip,
              borrowed: it.qty,
              pending: it.qty,
              borrow_date: todayISO,
            });
          } else {
            const r = rows[idx];
            rows[idx] = {
              ...r,
              faculty: fac || r.faculty,
              phone: ph || r.phone,
              borrowed: (r.borrowed || 0) + it.qty,
              pending: (r.pending || 0) + it.qty,
            };
          }
          return rows;
        });
      }

      openSheet(setShowBorrowSheet);
      setActiveTab("return");

      // reset rows ให้เหลือ 1 แถว (จำอุปกรณ์ตัวสุดท้ายไว้)
      setItems((prev) => {
        if (!prev.length) return [{ equip: "", qty: 1 }];
        return [{ ...prev[prev.length - 1], qty: 1 }];
      });
    } catch (e) {
      setBorrowError(e.message || "ไม่สามารถทำรายการยืมได้");
    } finally {
      setBorrowLoading(false);
    }
  }

  // ---------- return handlers ----------
  async function handleReturn(row, qtyReturn) {
    if (!qtyReturn || qtyReturn < 1) return;

    try {
      const payload = {
        equipment: row.equipment,
        qty: qtyReturn,
        student_id: row.student_id,
        faculty: row.faculty,
        phone: row.phone,
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

      // update pendingRows
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

      // update stock เพิ่มกลับ
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
    <div className="wrap-page" data-page="equipment">
      <HeaderUser displayName={displayName} BACKEND={BACKEND} />

      <main className="wrap equipment-wrap">
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
          <span className="mode-slider" aria-hidden="true" />
        </div>

        {/* ---------- Borrow section ---------- */}
        {activeTab === "borrow" && (
          <section id="borrowSection" className="grid">
            {/* card stock */}
            <div className="panel stock-card">
              <div className="stock-head">
                <div>อุปกรณ์กีฬา</div>
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

            {/* card form borrow */}
            <form
              className="panel form-card"
              onSubmit={(e) => {
                e.preventDefault();
                handleBorrow();
              }}
              noValidate
            >
              <label className="field">
                <span className="field-label">รหัสนิสิต</span>
                <input
                  id="studentId"
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="รหัสนิสิต (8 หลัก เริ่มด้วย 6)"
                  className="input"
                  aria-describedby="studentError"
                  value={studentId}
                  onChange={handleStudentChange}
                  onBlur={handleCheckFaculty}
                />
                {studentError && (
                  <small
                    id="studentError"
                    role="alert"
                    aria-live="assertive"
                    className="field-error"
                  >
                    {studentError}
                  </small>
                )}
              </label>

              <label className="field">
                <span className="field-label">เลือกคณะ</span>
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

              <label className="field">
                <span className="field-label">เบอร์โทร</span>
                <input
                  id="phone"
                  type="tel"
                  maxLength={10}
                  placeholder="เบอร์โทร 10 หลัก"
                  className="input"
                  value={phone}
                  onChange={handlePhoneChange}
                />
                {phoneError && (
                  <small className="field-error">{phoneError}</small>
                )}
              </label>

              <div className="field">
                <span className="field-label">
                  เลือกอุปกรณ์และจำนวน (หลายรายการได้)
                </span>

                <div className="multi-items">
                  {items.map((it, idx) => (
                    <div key={idx} className="multi-row">
                      <div className="select-wrap">
                        <select
                          value={it.equip}
                          onChange={(e) => updateItemEquip(idx, e.target.value)}
                        >
                          <option value="">เลือกอุปกรณ์</option>
                          {equipments.map((e) => (
                            <option key={e.name} value={e.name}>
                              {e.name}
                            </option>
                          ))}
                        </select>
                        <svg
                          className="caret"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            d="M6 9l6 6 6-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>

                      <div className="qty">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() =>
                            updateItemQty(idx, String(Math.max(1, it.qty - 1)))
                          }
                          aria-label="ลดจำนวน"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={it.qty}
                          onChange={(e) => updateItemQty(idx, e.target.value)}
                        />
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() =>
                            updateItemQty(idx, String(it.qty + 1))
                          }
                          aria-label="เพิ่มจำนวน"
                        >
                          +
                        </button>
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => removeItemRow(idx)}
                          aria-label="ลบรายการนี้"
                        >
                          ลบ
                        </button>
                      )}
                    </div>
                  ))}

                  {/* ปุ่มเพิ่มแถวแบบสวย ใช้ .btn-secondary */}
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={addItemRow}
                  >
                    เพิ่มอุปกรณ์อีกหนึ่งรายการ
                  </button>
                </div>
              </div>

              {borrowError && (
                <p className="hint error-text">{borrowError}</p>
              )}

              <div className="form-actions">
                <button
                  id="confirmBtn"
                  type="submit"
                  className="confirm"
                  disabled={borrowLoading}
                >
                  {borrowLoading ? "กำลังทำรายการ…" : "ทำการยืม"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ---------- Return section ---------- */}
        {activeTab === "return" && (
          <section id="returnSection">
            <h1 className="headline">รายการอุปกรณ์ที่ค้างคืน</h1>

            <div className="toolbar">
              <label className="field sid">
                <span className="legend">กรองด้วยรหัสนิสิต</span>
                <input
                  className="input"
                  type="text"
                  placeholder="พิมพ์เพื่อกรอง..."
                  value={filterSid}
                  onChange={(e) => setFilterSid(e.target.value)}
                />
              </label>

              <label className="field date">
                <span className="legend">กรองด้วยวันที่ยืม</span>
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
                  onClick={() => {
                    setFilterSid(filterSid.trim());
                  }}
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
              <p className="hint error-text">{returnError}</p>
            )}
            {returnLoading && (
              <p className="hint">กำลังโหลดรายการค้างคืน…</p>
            )}

            <div className="table-container">
              <table className="table-return" aria-label="ตารางคืนอุปกรณ์">
                <thead>
                  <tr>
                    <th>ลำดับ</th>
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
            ทำการยืม
            <br />
            เสร็จสิ้น
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
          <div className="sheet-title">คืนอุปกรณ์เสร็จสิ้น</div>
          <div className="sheet-icon">✔</div>
        </div>
      </div>
    </div>
  );
}

// แถวในตารางคืน
function ReturnRow({ index, row, onReturn }) {
  const [val, setVal] = useState(String(row.pending || 1));
  const max = row.pending || 0;

  useEffect(() => {
    setVal(String(row.pending || 1));
  }, [row.pending]);

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
