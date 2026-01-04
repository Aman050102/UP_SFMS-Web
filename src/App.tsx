// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

// ===== users =====
import UserMenu from "./pages/users/UserMenu";
import CheckinPage from "./pages/users/CheckinPage";
import CheckinFeedback from "./pages/users/CheckinFeedback";
import EquipmentPage from "./pages/users/EquipmentPage";

// ===== staff =====
import StaffMenu from "./pages/staff/StaffMenu";
import StaffEquipmentManagePage from "./pages/staff/StaffEquipmentManagePage";
import StaffBorrowLedgerPage from "./pages/staff/StaffBorrowLedgerPage";

export default function App() {
  return (
    <Routes>
      {/* auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* users */}
      <Route path="/user/menu" element={<UserMenu />} />
      <Route path="/checkin" element={<CheckinPage />} />
      <Route path="/checkin_feedback" element={<CheckinFeedback />} />
      <Route path="/equipment" element={<EquipmentPage />} />

      {/* staff */}
      <Route path="/staff/menu" element={<StaffMenu />} />
      <Route
        path="/staff_equipment"
        element={<StaffEquipmentManagePage />}
      />
      <Route
        path="/staff/borrow-ledger"
        element={<StaffBorrowLedgerPage />}
      />

      {/* default */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
