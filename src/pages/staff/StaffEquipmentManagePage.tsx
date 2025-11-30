// src/pages/staff/StaffEquipmentManagePage.jsx
import React, { useEffect, useState } from "react";
import HeaderStaff from "../../components/HeaderStaff";
import "../../styles/staff-equipment.css";

// ------ BACKEND & Helpers ------

// ใช้ BASE_URL จาก .env ถ้าไม่มีใช้ origin เดียวกับ frontend
const BACKEND = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

// endpoint ฝั่ง staff
const API_LIST = `${BACKEND}/api/staff/equipments/`;
const API_ITEM = (id) => `${BACKEND}/api/staff/equipment/${id || 0}/`;

// อ่าน csrftoken จาก cookie
function getCsrfToken() {
  const m = document.cookie.match(/(?:^|;)\s*csrftoken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

const clampInt = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.floor(num));
};

const toKeyName = (s) => (s || "").trim().toLowerCase();

// ------ Component ------

export default function StaffEquipmentManagePage() {
  const [items, setItems] = useState([]);
  const [equipName, setEquipName] = useState("");
  const [equipStock, setEquipStock] = useState("10");
  const [showSheet, setShowSheet] = useState(false);

  // inline name-edit state
  const [editingNameId, setEditingNameId] = useState(null);
  const [editingNameValue, setEditingNameValue] = useState("");

  // ชื่อเจ้าหน้าที่ที่โชว์บน Header
  const [displayName, setDisplayName] = useState(
    localStorage.getItem("display_name") || "เจ้าหน้าที่"
  );

  // set data-page สำหรับธีม staff-equipment
  useEffect(() => {
    document.body.setAttribute("data-page", "staff-equipment");
    return () => {
      document.body.removeAttribute("data-page");
    };
  }, []);

  // ดึงข้อมูล user จาก backend (กันกรณียังไม่ได้เปิด StaffMenu มาก่อน)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch(`${BACKEND}/auth/me/`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("not ok");
        const data = await res.json();
        if (data?.ok && data?.username) {
          setDisplayName(data.username);
          localStorage.setItem("display_name", data.username);
        } else {
          window.location.href = "/login?role=staff";
        }
      } catch {
        window.location.href = "/login?role=staff";
      }
    };
    loadUser();
  }, []);

  // load equipment list
  const fetchList = async () => {
    try {
      const res = await fetch(API_LIST, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        alert("โหลดรายการไม่สำเร็จ");
        return;
      }
      const data = await res.json();
      const rows = (data && (data.rows || data.data || [])) || [];
      setItems(rows);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const openSheet = () => {
    setShowSheet(true);
    setTimeout(() => setShowSheet(false), 1200);
  };

  const findExistingByName = (name) => {
    const key = toKeyName(name);
    return items.find((it) => toKeyName(it.name) === key) || null;
  };

  const handleAdd = async () => {
    const name = equipName.trim();
    if (!name) {
      alert("กรุณากรอกชื่ออุปกรณ์");
      return;
    }

    const addStock = clampInt(equipStock);
    if (addStock <= 0) {
      alert("จำนวนสต็อกต้องมากกว่า 0");
      return;
    }

    const exist = findExistingByName(name);

    // ถ้ามีชื่อซ้ำ → PATCH เพิ่ม stock
    if (exist) {
      const newStock = exist.stock + addStock;
      const newTotal = Math.max(exist.total, newStock);

      try {
        const res = await fetch(API_ITEM(exist.id), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCsrfToken(),
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ stock: newStock, total: newTotal }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) {
          alert(data.message || "อัปเดตสต็อกไม่สำเร็จ");
          return;
        }
        openSheet();
        fetchList();
      } catch (e) {
        console.error(e);
        alert("อัปเดตสต็อกไม่สำเร็จ");
      }
    } else {
      // POST สร้างใหม่ total = stock เริ่มต้น
      const stock = addStock;
      const total = stock;

      try {
        const res = await fetch(API_ITEM(0), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCsrfToken(),
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ name, stock, total }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) {
          alert(data.message || "เพิ่มรายการไม่สำเร็จ");
          return;
        }
        openSheet();
        fetchList();
      } catch (e) {
        console.error(e);
        alert("เพิ่มรายการไม่สำเร็จ");
      }
    }

    // clear form
    setEquipName("");
    setEquipStock("10");
  };

  const handleSaveRow = async (row) => {
    const stock = clampInt(row.stock);
    const curTotal = clampInt(row.total);
    const body = {
      name: (row.name || "").trim(),
      stock,
    };
    if (stock > curTotal) {
      body.total = stock;
    }

    try {
      const res = await fetch(API_ITEM(row.id), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken(),
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        alert(data.message || "บันทึกไม่สำเร็จ");
        return;
      }

      const updated = data.row || body;

      setItems((prev) =>
        prev.map((it) =>
          it.id === row.id
            ? {
                ...it,
                name: updated.name ?? row.name,
                stock: updated.stock ?? stock,
                total: updated.total ?? body.total ?? curTotal,
              }
            : it
        )
      );

      setEditingNameId(null);
      setEditingNameValue("");
      openSheet();
    } catch (e) {
      console.error(e);
      alert("บันทึกไม่สำเร็จ");
    }
  };

  const handleDeleteRow = async (row) => {
    if (!window.confirm("ต้องการลบรายการนี้หรือไม่?")) return;

    try {
      const res = await fetch(API_ITEM(row.id), {
        method: "DELETE",
        headers: {
          "X-CSRFToken": getCsrfToken(),
          Accept: "application/json",
        },
        credentials: "include",
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        /* ignore */
      }
      if (!res.ok || data.ok === false) {
        alert(data.message || "ลบไม่สำเร็จ");
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== row.id));
      openSheet();
    } catch (e) {
      console.error(e);
      alert("ลบไม่สำเร็จ");
    }
  };

  const startEditName = (row) => {
    setEditingNameId(row.id);
    setEditingNameValue(row.name);
  };

  const cancelEditName = () => {
    setEditingNameId(null);
    setEditingNameValue("");
  };

  const updateRowLocalStock = (id, stock) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, stock } : it))
    );
  };

  const updateRowLocalName = (id, name) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, name } : it))
    );
  };

  return (
    <div data-page="staff-equipment">
      {/* ส่ง displayName + BACKEND ให้ HeaderStaff แบบเดียวกับ StaffMenu */}
      <HeaderStaff displayName={displayName} BACKEND={BACKEND} />

      <main className="wrap narrower staff-equipment-wrap">
        {/* secondary tabs */}
        <nav className="mainmenu" aria-label="เมนูรอง">
          <ul>
            <li>
              {/* ใช้ path /staff_equipment ให้ตรงกับ tile เดิม */}
              <a className="tab active" href="/staff_equipment">
                ✓ จัดการอุปกรณ์กีฬา
              </a>
            </li>
            <li>
              {/* อันนี้เตรียมไว้ให้หน้า ledger อนาคต */}
              <a className="tab" href="/staff/borrow-ledger">
                บันทึกการยืม-คืน
              </a>
            </li>
          </ul>
        </nav>

        <h1 className="page-title">เพิ่มและจัดการอุปกรณ์กีฬา</h1>

        {/* add row */}
        <div className="add-row">
          <input
            id="equipName"
            type="text"
            className="input name-input"
            placeholder="เพิ่มรายการ (เช่น ลูกบอล, ไม้แบด, ฯลฯ)"
            value={equipName}
            onChange={(e) => setEquipName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />
          <input
            id="equipStock"
            type="number"
            min={0}
            className="input stock-input"
            placeholder="สต็อกเริ่มต้น"
            value={equipStock}
            onChange={(e) => setEquipStock(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />
          <button id="btnAdd" className="btn primary" onClick={handleAdd}>
            <span className="icon">＋</span>
            เพิ่ม
          </button>
        </div>

        {/* list */}
        <section className="panel equip-panel">
          <header className="table-head">
            <div>อุปกรณ์กีฬา</div>
            <div>คงเหลือ</div>
            <div className="actions-col">จัดการ</div>
          </header>

          <ul id="equipList" className="list">
            {items.length === 0 && (
              <li className="empty">ยังไม่มีรายการอุปกรณ์</li>
            )}

            {items.map((row) => {
              const isEditing = editingNameId === row.id;
              return (
                <li key={row.id} className="row">
                  {/* name */}
                  <div className="name-wrap">
                    {!isEditing && (
                      <span
                        className="name"
                        title="ดับเบิลคลิกเพื่อแก้ชื่อ"
                        onDoubleClick={() => startEditName(row)}
                      >
                        {row.name}
                      </span>
                    )}
                    {isEditing && (
                      <input
                        className="name-edit"
                        type="text"
                        value={editingNameValue}
                        onChange={(e) => {
                          setEditingNameValue(e.target.value);
                          updateRowLocalName(row.id, e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveRow({
                              ...row,
                              name: editingNameValue,
                            });
                          } else if (e.key === "Escape") {
                            cancelEditName();
                          }
                        }}
                        onBlur={cancelEditName}
                        autoFocus
                      />
                    )}
                  </div>

                  {/* stock stepper */}
                  <div className="inline-edit">
                    <button
                      className="icon-btn steper dec"
                      type="button"
                      title="ลดลง"
                      onClick={() =>
                        updateRowLocalStock(row.id, Math.max(0, row.stock - 1))
                      }
                    >
                      −
                    </button>
                    <input
                      className="stock"
                      type="number"
                      min={0}
                      value={row.stock}
                      onChange={(e) =>
                        updateRowLocalStock(row.id, clampInt(e.target.value))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveRow(row);
                        } else if (e.key === "Escape") {
                          e.target.blur();
                        }
                      }}
                    />
                    <button
                      className="icon-btn steper inc"
                      type="button"
                      title="เพิ่มขึ้น"
                      onClick={() =>
                        updateRowLocalStock(row.id, row.stock + 1)
                      }
                    >
                      +
                    </button>
                  </div>

                  {/* actions */}
                  <div className="actions">
                    <button
                      className="icon-btn save"
                      type="button"
                      title="บันทึก"
                      onClick={() => handleSaveRow(row)}
                    >
                      💾
                    </button>
                    <button
                      className="icon-btn danger del"
                      type="button"
                      title="ลบ"
                      onClick={() => handleDeleteRow(row)}
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      {/* toast / sheet */}
      <div
        id="sheetOk"
        className="sheet"
        aria-hidden={showSheet ? "false" : "true"}
      >
        <div className="sheet-card">
          <div className="sheet-title">ดำเนินการสำเร็จ</div>
          <div className="sheet-icon">✔</div>
        </div>
      </div>
    </div>
  );
}
