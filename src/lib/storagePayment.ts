import { fetchAuthSession } from "aws-amplify/auth";
import { uploadData } from "aws-amplify/storage";

/**
 * Sube un comprobante a S3 bajo `payment-proofs/{identityId}/...`
 * Debe coincidir con las reglas en `amplify/storage/resource.ts`.
 */
export async function uploadPaymentProof(file: File): Promise<string> {
  const session = await fetchAuthSession();
  const identityId = session.identityId;
  if (!identityId) {
    throw new Error("No hay sesión de identidad para subir el archivo. Inicia sesión de nuevo.");
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `payment-proofs/${identityId}/${Date.now()}-${safeName}`;
  await uploadData({
    path,
    data: file,
    options: { contentType: file.type || "application/octet-stream" },
  }).result;
  return path;
}
