import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "mimiplayStorage",
  access: (allow) => ({
    "payment-proofs/*": [
      allow.authenticated.to(["read", "write"]),
      allow.groups(["admin"]).to(["read", "write", "delete"]),
    ],
    "support-attachments/*": [
      allow.authenticated.to(["read", "write"]),
      allow.groups(["admin"]).to(["read", "write", "delete"]),
    ],
    /** Banners de planes (catálogo público): solo admin sube; lectura para invitados (imágenes en /catalogo). */
    "catalog-promo-images/*": [
      allow.groups(["admin"]).to(["read", "write", "delete"]),
      allow.guest().to(["read"]),
      allow.authenticated().to(["read"]),
    ],
  }),
});
