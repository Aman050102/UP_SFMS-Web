import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";

// หน้าของนิสิต
import UserMenu from "./pages/users/UserMenu";
import CheckinPage from "./pages/users/CheckinPage";
import EquipmentPage from "./pages/users/EquipmentPage";
import CheckinFeedback from "./pages/users/CheckinFeedback"; 

// หน้าของเจ้าหน้าที่
import StaffMenu from "./pages/staff/StaffMenu";
import StaffEquipmentManagePage from "./pages/staff/StaffEquipmentManagePage";
import StaffBorrowLedgerPage from "./pages/staff/StaffBorrowLedgerPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<MainLayout role="user" />}>
        <Route path="/user/menu" element={<UserMenu />} />
        <Route path="/checkin" element={<CheckinPage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/checkin_feedback" element={<CheckinFeedback />} /> {/* เพิ่ม Route นี้ */}
      </Route>

      <Route element={<MainLayout role="staff" />}>
        <Route path="/staff/menu" element={<StaffMenu />} />
        <Route path="/staff/equipment" element={<StaffEquipmentManagePage />} />
        <Route path="/staff/borrow-ledger" element={<StaffBorrowLedgerPage />} />
        <Route path="/checkin_report" element={<div>หน้าจอรายงานเข้าใช้สนาม</div>} />
        <Route path="/staff_borrow_stats" element={<div>หน้าจอสถิติการยืม</div>} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
