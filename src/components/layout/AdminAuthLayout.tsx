import { useClientAuth } from "@/auth/ClientAuthContext";
import { sessionAdminGroups } from "@/lib/cognitoGroups";
import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { AdminAccessDenied } from "@/pages/AdminAccessDenied";
import { AdminLoginPage } from "@/pages/AdminLoginPage";
import { fetchAuthSession } from "aws-amplify/auth";
import { useEffect, useState } from "react";
import { AdminShell } from "./AdminShell";

const ADMIN_GROUP = "admin";

type StaffAccess = "pending" | "allowed" | "denied";

export function AdminAuthLayout() {
  const { user, loading } = useClientAuth();
  const [staffAccess, setStaffAccess] = useState<StaffAccess>("pending");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setStaffAccess("pending");
      return;
    }

    let cancelled = false;
    setStaffAccess("pending");

    (async () => {
      try {
        let session = await fetchAuthSession({ forceRefresh: false });
        let groups = sessionAdminGroups(session);
        if (groups.length === 0) {
          session = await fetchAuthSession({ forceRefresh: true });
          groups = sessionAdminGroups(session);
        }
        if (cancelled) return;
        setStaffAccess(groups.includes(ADMIN_GROUP) ? "allowed" : "denied");
      } catch {
        if (cancelled) return;
        setStaffAccess("denied");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.userId, loading]);

  if (loading) {
    return <MimiLoadingState tone="dark" layout="fullscreen" />;
  }

  if (!user) {
    return <AdminLoginPage />;
  }

  if (staffAccess === "pending") {
    return <MimiLoadingState tone="dark" layout="fullscreen" />;
  }

  if (staffAccess === "denied") {
    return <AdminAccessDenied />;
  }

  return <AdminShell />;
}
