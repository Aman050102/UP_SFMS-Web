// src/lib/auth.ts
const API = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

/** เช็ค session ยังอยู่ไหม ไม่อยู่ให้ redirect ไปหน้า login */
export async function ensureSession(nextPath?: string) {
  const r = await fetch(`${API}/auth/me/`, { credentials: "include" });
  if (r.status === 401) {
    const next = encodeURIComponent(nextPath || location.pathname);
    location.href = `/login?next=${next}`;
    return false;
  }
  return true;
}
