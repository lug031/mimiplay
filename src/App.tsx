import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminAuthLayout } from "@/components/layout/AdminAuthLayout";
import { AuthRoot } from "@/components/layout/AuthRoot";
import { LandingPage } from "@/pages/LandingPage";
import { CatalogPage } from "@/pages/CatalogPage";
import { ClientHome } from "@/pages/ClientHome";
import { ClientOrdersPage } from "@/pages/ClientOrdersPage";
import { ClientOrderDetailPage } from "@/pages/ClientOrderDetailPage";
import { ClientPlansPage } from "@/pages/ClientPlansPage";
import { ClientNewOrderPage } from "@/pages/ClientNewOrderPage";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminInventoryPage } from "@/pages/admin/AdminInventoryPage";
import { AdminOrdersPage } from "@/pages/admin/AdminOrdersPage";
import { AdminCatalogPage } from "@/pages/admin/AdminCatalogPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/app" element={<AuthRoot variant="client" />}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<ClientHome />} />
          <Route path="planes" element={<ClientPlansPage />} />
          <Route path="pedido/nuevo" element={<ClientNewOrderPage />} />
          <Route path="pedidos" element={<ClientOrdersPage />} />
          <Route path="pedidos/:orderId" element={<ClientOrderDetailPage />} />
        </Route>
        <Route path="/admin" element={<AdminAuthLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="catalogo" element={<AdminCatalogPage />} />
          <Route path="pedidos" element={<AdminOrdersPage />} />
          <Route path="cola" element={<AdminOrdersPage queueOnly />} />
          <Route path="inventario" element={<AdminInventoryPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
