// src/lib/api.ts
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    method: "GET",
  });
  if (!r.ok) throw new Error(`GET ${path} ${r.status}`);
  return (await r.json()) as T;
}

export async function apiPost<TReq, TRes>(
  path: string,
  body: TReq,
  init?: RequestInit
): Promise<TRes> {
  const r = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: JSON.stringify(body),
    ...init,
  });
  if (!r.ok) throw new Error(`POST ${path} ${r.status}`);
  return (await r.json()) as TRes;
}