import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { ClientAuthProvider } from "@/auth/ClientAuthContext";
import { ClientNotificationsProvider } from "@/context/ClientNotificationsContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ClientAuthLayout } from "@/components/auth/ClientAuthLayout";
import { RequireClientAuth } from "@/components/auth/RequireClientAuth";
import { AdminAuthLayout } from "@/components/layout/AdminAuthLayout";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import { AdminCatalogPage } from "@/pages/admin/AdminCatalogPage";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminInventoryPage } from "@/pages/admin/AdminInventoryPage";
import { AdminOrdersPage } from "@/pages/admin/AdminOrdersPage";
import { AdminInformesPage } from "@/pages/admin/AdminInformesPage";
import { AdminClientesPage } from "@/pages/admin/AdminClientesPage";
import { AdminClaimsPage } from "@/pages/admin/AdminClaimsPage";
import { CatalogPage } from "@/pages/CatalogPage";
import { ClientAuthLoginPage } from "@/pages/ClientAuthLoginPage";
import { ClientAuthRegisterPage } from "@/pages/ClientAuthRegisterPage";
import { ClientNewOrderPage } from "@/pages/ClientNewOrderPage";
import { ClientOrderDetailPage } from "@/pages/ClientOrderDetailPage";
import { ClientAccountPage } from "@/pages/ClientAccountPage";
import { ClientNotificationsPage } from "@/pages/ClientNotificationsPage";
import { ClientOrdersPage } from "@/pages/ClientOrdersPage";
import { ClientClaimsPage } from "@/pages/ClientClaimsPage";
import { ClientNewClaimPage } from "@/pages/ClientNewClaimPage";
import { ClientClaimDetailPage } from "@/pages/ClientClaimDetailPage";
import { LandingPage } from "@/pages/LandingPage";
import { ClientOnboardingWizard } from "@/components/onboarding/ClientOnboardingWizard";

/** `/app/acceso` sin segmento: envía a login o registro según query heredada (`tipo=`) o por defecto login. */
function ClientAuthIndexRedirect() {
  const [sp] = useSearchParams();
  const tipo = sp.get("tipo");
  const p = new URLSearchParams(sp);
  p.delete("tipo");
  const suffix = p.toString() ? `?${p.toString()}` : "";
  if (tipo === "registro") {
    return <Navigate to={`/app/acceso/registro${suffix}`} replace />;
  }
  return <Navigate to={`/app/acceso/login${suffix}`} replace />;
}

/** Compatibilidad con enlaces antiguos `/app/login` y `/app/registro`. */
function LegacyAuthRedirect({ segment }: { segment: "login" | "registro" }) {
  const [sp] = useSearchParams();
  const p = new URLSearchParams(sp);
  const suffix = p.toString() ? `?${p.toString()}` : "";
  return <Navigate to={`/app/acceso/${segment}${suffix}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ClientAuthProvider>
        <ClientNotificationsProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route element={<ClientPortalLayout />}>
              <Route path="catalogo" element={<CatalogPage />} />
              <Route path="app/acceso" element={<ClientAuthLayout />}>
                <Route index element={<ClientAuthIndexRedirect />} />
                <Route path="login" element={<ClientAuthLoginPage />} />
                <Route path="registro" element={<ClientAuthRegisterPage />} />
              </Route>
              <Route path="app/login" element={<LegacyAuthRedirect segment="login" />} />
              <Route path="app/registro" element={<LegacyAuthRedirect segment="registro" />} />
              <Route path="app" element={<RequireClientAuth />}>
                <Route index element={<Navigate to="/catalogo" replace />} />
                <Route path="inicio" element={<Navigate to="/catalogo" replace />} />
                <Route path="planes" element={<Navigate to="/catalogo" replace />} />
                <Route path="anuncios" element={<Navigate to="/catalogo" replace />} />
                <Route path="pedido/nuevo" element={<ClientNewOrderPage />} />
                <Route path="pedidos" element={<ClientOrdersPage />} />
                <Route path="pedidos/:orderId" element={<ClientOrderDetailPage />} />
                <Route path="reclamos" element={<ClientClaimsPage />} />
                <Route path="reclamos/nuevo" element={<ClientNewClaimPage />} />
                <Route path="reclamos/:claimId" element={<ClientClaimDetailPage />} />
                <Route path="notificaciones" element={<ClientNotificationsPage />} />
                <Route path="cuenta" element={<ClientAccountPage />} />
              </Route>
            </Route>

            <Route path="/admin" element={<AdminAuthLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="catalogo" element={<AdminCatalogPage />} />
              <Route path="pedidos" element={<AdminOrdersPage />} />
              <Route path="vigencia-pedidos" element={<Navigate to="/admin/pedidos?vista=vigencia" replace />} />
              <Route path="informes" element={<AdminInformesPage />} />
              <Route path="clientes" element={<AdminClientesPage />} />
              <Route path="reclamos" element={<AdminClaimsPage />} />
              <Route path="cola" element={<Navigate to="/admin/pedidos" replace />} />
              <Route path="inventario" element={<AdminInventoryPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          {/* Una sola instancia: landing `/` y rutas del portal (catálogo, /app/*) sin perder el paso al navegar. */}
          <ClientOnboardingWizard />
        </ClientNotificationsProvider>
      </ClientAuthProvider>
    </BrowserRouter>
  );
}
