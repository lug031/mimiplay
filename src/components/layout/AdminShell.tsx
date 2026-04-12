import { AdminSnackbarProvider } from "@/components/admin/AdminSnackbar";
import { AdminSidebar } from "@/components/shell/AdminSidebar";
import { Outlet } from "react-router-dom";

export function AdminShell() {
  return (
    <AdminSnackbarProvider>
      <div className="flex min-h-svh flex-col bg-mimi-black font-manrope md:block">
        <AdminSidebar />
        <div className="flex min-h-0 flex-1 flex-col bg-neutral-50 text-mimi-black antialiased md:min-h-svh md:pl-60">
          <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminSnackbarProvider>
  );
}
