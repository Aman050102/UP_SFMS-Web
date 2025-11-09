import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // เช่น http://localhost:8000
  withCredentials: true, // ถ้าจะใช้ session/cookie-based
});

export default client;
