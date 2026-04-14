import { fetchAuthSession } from "aws-amplify/auth";
import { uploadData } from "aws-amplify/storage";

/** Sube imagen opcional del reclamo bajo `support-attachments/claim-images/{identityId}/…`. */
export async function uploadClaimImage(file: File): Promise<string> {
  const session = await fetchAuthSession();
  const identityId = session.identityId;
  if (!identityId) {
    throw new Error("No hay sesión de identidad. Inicia sesión de nuevo.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen (JPG, PNG, WebP, etc.).");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("La imagen no puede superar 5 MB.");
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `support-attachments/claim-images/${identityId}/${Date.now()}-${safeName}`;
  await uploadData({
    path,
    data: file,
    options: { contentType: file.type || "image/jpeg" },
  }).result;
  return path;
}
