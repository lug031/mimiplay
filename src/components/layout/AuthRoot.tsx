import { Authenticator } from "@aws-amplify/ui-react";
import { AuthChrome } from "./AuthChrome";

type Props = {
  variant: "client" | "admin";
};

export function AuthRoot({ variant }: Props) {
  return (
    <Authenticator>
      <AuthChrome variant={variant} />
    </Authenticator>
  );
}
