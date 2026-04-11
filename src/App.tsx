import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminAuthLayout } from "@/components/layout/AdminAuthLayout";
import { AuthRoot } from "@/components/layout/AuthRoot";
import { LandingPage } from "@/pages/LandingPage";
import { ClientHome } from "@/pages/ClientHome";
import { ClientOrdersPage } from "@/pages/ClientOrdersPage";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminInventoryPage } from "@/pages/admin/AdminInventoryPage";
import { AdminQueuePage } from "@/pages/admin/AdminQueuePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AuthRoot variant="client" />}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<ClientHome />} />
          <Route path="pedidos" element={<ClientOrdersPage />} />
        </Route>
        <Route path="/admin" element={<AdminAuthLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="inventario" element={<AdminInventoryPage />} />
          <Route path="cola" element={<AdminQueuePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
