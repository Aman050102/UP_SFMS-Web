// src/lib/csrf.ts
const API = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export function getCookie(name: string) {
  const v = `; ${document.cookie}`;
  const p = v.split(`; ${name}=`);
  return p.length === 2 ? p.pop()!.split(";").shift()! : "";
}

/** ยิงไปตั้ง csrftoken ที่เบราว์เซอร์ (SameSite=Lax) */
export async function primeCsrf() {
  await fetch(`${API}/auth/csrf/`, { credentials: "include" });
}

/** header สำหรับ POST/PUT/DELETE ที่ต้องมี CSRF */
export function csrfHeaders(extra?: Record<string, string>) {
  return {
    "X-CSRFToken": getCookie("csrftoken"),
    "X-Requested-With": "XMLHttpRequest",
    ...extra,
  };
}
