import { Authenticator } from "@aws-amplify/ui-react";
import { AdminGate } from "@/components/admin/AdminGate";
import { AuthChrome } from "./AuthChrome";

export function AdminAuthLayout() {
  return (
    <Authenticator>
      <AdminGate>
        <AuthChrome variant="admin" />
      </AdminGate>
    </Authenticator>
  );
}
