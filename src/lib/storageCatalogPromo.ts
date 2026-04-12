import { fetchAuthSession } from "aws-amplify/auth";
import { uploadData } from "aws-amplify/storage";

const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Sube imagen de anuncio de plan. Debe coincidir con `catalog-promo-images/*` en `amplify/storage/resource.ts`.
 * Guarda en el anuncio (`ServicePlan.promoImageUrl`) la ruta devuelta (no la URL firmada), para renovar firmas en la tienda.
 */
export async function uploadCatalogPromoImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen (JPG, PNG, WebP…).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La imagen supera 2 MB. Reduce tamaño o comprímela.");
  }
  const session = await fetchAuthSession({ forceRefresh: true });
  if (!session.tokens) {
    throw new Error("Sesión no válida para subir. Vuelve a iniciar sesión como admin.");
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `catalog-promo-images/${Date.now()}-${safeName}`;
  await uploadData({
    path,
    data: file,
    options: { contentType: file.type || "image/jpeg" },
  }).result;
  return path;
}
