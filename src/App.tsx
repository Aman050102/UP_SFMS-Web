import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserMenu from "./pages/UserMenu";
import StaffMenu from "./pages/StaffMenu";
import CheckinPage from "./pages/CheckinPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/user/menu" element={<UserMenu />} />
      <Route
        path="/staff/menu"
        element={
          <StaffMenu
            displayName="เจ้าหน้าที่"
            backendBase="http://localhost:8000"
          />
        }
      />
      <Route path="/checkin" element={<CheckinPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}