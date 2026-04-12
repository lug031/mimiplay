import { uploadCatalogPromoImage } from "@/lib/storageCatalogPromo";
import { getUrl } from "aws-amplify/storage";
import { type ChangeEvent, useEffect, useState } from "react";

function PromoImagePreview({ raw, frameClass }: { raw: string; frameClass: string }) {
  const isHttp = /^https?:\/\//i.test(raw);
  const [src, setSrc] = useState<string | null>(() => (isHttp ? raw : null));

  useEffect(() => {
    if (isHttp) return;
    let cancelled = false;
    getUrl({ path: raw })
      .then(({ url }) => {
        if (!cancelled) setSrc(url.toString());
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [raw, isHttp]);

  if (!src) return null;
  return (
    <div className={`mt-3 overflow-hidden rounded-lg ${frameClass}`}>
      <img src={src} alt="" className="max-h-40 w-full object-contain object-center" />
    </div>
  );
}

const styles = {
  dark: {
    label: "block text-xs font-bold text-white/70",
    input:
      "mt-1 w-full rounded-lg border border-white/25 bg-white px-3 py-2 text-sm text-mimi-black placeholder:text-mimi-muted",
    hint: "text-[11px] text-white/45",
    button:
      "inline-flex cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/15 disabled:opacity-50",
    previewFrame: "border border-white/10 bg-mimi-black",
  },
  light: {
    label: "block text-xs font-bold text-mimi-black",
    input:
      "mt-1 w-full rounded-lg border border-mimi-black/12 bg-white px-3 py-2 text-sm text-mimi-black placeholder:text-mimi-muted",
    hint: "text-[11px] text-mimi-muted",
    button:
      "inline-flex cursor-pointer items-center justify-center rounded-full border border-mimi-black/15 bg-mimi-black/[0.06] px-4 py-2 text-xs font-bold text-mimi-black hover:bg-mimi-black/[0.1] disabled:opacity-50",
    previewFrame: "border border-mimi-black/12 bg-mimi-black/[0.04]",
  },
} as const;

type Props = {
  inputId: string;
  label?: string;
  value: string;
  onChange: (next: string) => void;
  variant: keyof typeof styles;
  disabled?: boolean;
  onUploadError?: (message: string) => void;
};

/**
 * Campo unificado: URL pública o subida a `catalog-promo-images/*` (modal y formulario de anuncio).
 */
export function PlanPromoImageField({
  inputId,
  label = "Imagen del anuncio (URL o archivo)",
  value,
  onChange,
  variant,
  disabled = false,
  onUploadError,
}: Props) {
  const s = styles[variant];
  const [uploading, setUploading] = useState(false);
  const trimmed = value.trim();

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadCatalogPromoImage(file);
      onChange(path);
    } catch (err) {
      onUploadError?.(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className={s.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={s.input}
        placeholder="https://… o adjunta un archivo (se guarda en el almacén MimiPlay)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || uploading}
      />
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className={s.button}>
          <input type="file" accept="image/*" className="sr-only" onChange={(ev) => void onPickFile(ev)} disabled={disabled || uploading} />
          {uploading ? "Subiendo…" : "Adjuntar imagen"}
        </label>
        <span className={s.hint}>Máx. 2 MB · JPG, PNG o WebP</span>
      </div>
      {trimmed ? <PromoImagePreview key={trimmed} raw={trimmed} frameClass={s.previewFrame} /> : null}
    </div>
  );
}
