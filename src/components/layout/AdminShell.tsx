import { AdminSnackbarProvider } from "@/components/admin/AdminSnackbar";
import { AdminSidebar } from "@/components/shell/AdminSidebar";
import { Outlet } from "react-router-dom";

export function AdminShell() {
  return (
    <AdminSnackbarProvider>
      <div className="flex min-h-screen flex-col bg-mimi-black font-manrope md:flex-row">
        <AdminSidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-zinc-100 text-zinc-900 antialiased">
          <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminSnackbarProvider>
  );
}
