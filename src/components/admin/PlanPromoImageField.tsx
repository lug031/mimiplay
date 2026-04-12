import { uploadCatalogPromoImage } from "@/lib/storageCatalogPromo";
import { getUrl } from "aws-amplify/storage";
import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

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
    dropzone:
      "mt-1 flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/35",
    dropzoneIdle: "border-white/25 bg-white/[0.04] hover:border-white/40 hover:bg-white/[0.07]",
    dropzoneActive: "border-amber-400/60 bg-amber-500/10",
    hint: "text-[11px] text-white/45",
    button:
      "inline-flex cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/15 disabled:opacity-50",
    previewFrame: "border border-white/10 bg-mimi-black",
    kbd: "rounded border border-white/20 bg-white/10 px-1 py-0.5 font-mono text-[10px] text-white/80",
  },
  light: {
    label: "block text-xs font-bold text-mimi-black",
    dropzone:
      "mt-1 flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-mimi-black/25",
    dropzoneIdle: "border-mimi-black/18 bg-mimi-black/[0.02] hover:border-mimi-black/35 hover:bg-mimi-black/[0.04]",
    dropzoneActive: "border-amber-500/55 bg-amber-500/[0.08]",
    hint: "text-[11px] text-mimi-muted",
    button:
      "inline-flex cursor-pointer items-center justify-center rounded-full border border-mimi-black/15 bg-mimi-black/[0.06] px-4 py-2 text-xs font-bold text-mimi-black hover:bg-mimi-black/[0.1] disabled:opacity-50",
    previewFrame: "border border-mimi-black/12 bg-mimi-black/[0.04]",
    kbd: "rounded border border-mimi-black/15 bg-mimi-black/[0.06] px-1 py-0.5 font-mono text-[10px] text-mimi-subtle",
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

function isImageFile(f: File) {
  return f.type.startsWith("image/");
}

/**
 * Solo subida a almacén (sin campo URL). Zona de arrastre, archivo y pegado con Ctrl+V cuando la zona tiene foco.
 */
export function PlanPromoImageField({
  inputId,
  label = "Imagen del anuncio",
  value,
  onChange,
  variant,
  disabled = false,
  onUploadError,
}: Props) {
  const s = styles[variant];
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const zoneRef = useRef<HTMLDivElement>(null);
  const trimmed = value.trim();

  const runUpload = useCallback(
    async (file: File) => {
      if (!isImageFile(file)) {
        onUploadError?.("El archivo debe ser una imagen (JPG, PNG, WebP…).");
        return;
      }
      setUploading(true);
      try {
        const path = await uploadCatalogPromoImage(file);
        onChange(path);
      } catch (err) {
        onUploadError?.(err instanceof Error ? err.message : "No se pudo subir la imagen.");
      } finally {
        setUploading(false);
      }
    },
    [onChange, onUploadError],
  );

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await runUpload(file);
  }

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (disabled || uploading) return;
      const items = e.clipboardData?.items;
      if (!items?.length) return;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it?.kind === "file") {
          const f = it.getAsFile();
          if (f && isImageFile(f)) {
            e.preventDefault();
            void runUpload(f);
            return;
          }
        }
      }
    },
    [disabled, uploading, runUpload],
  );

  return (
    <div>
      <label className={s.label} htmlFor={`${inputId}-file`}>
        {label}
      </label>
      <div
        ref={zoneRef}
        id={inputId}
        role="button"
        tabIndex={disabled || uploading ? -1 : 0}
        aria-disabled={disabled || uploading}
        aria-describedby={`${inputId}-hint`}
        className={`${s.dropzone} ${dragOver ? s.dropzoneActive : s.dropzoneIdle}`}
        onPaste={onPaste}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          if (disabled || uploading) return;
          const f = e.dataTransfer.files?.[0];
          if (f) void runUpload(f);
        }}
        onClick={() => {
          if (disabled || uploading) return;
          document.getElementById(`${inputId}-file`)?.click();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled && !uploading) document.getElementById(`${inputId}-file`)?.click();
          }
        }}
      >
        <p className="text-sm font-bold text-current">
          {uploading ? "Subiendo…" : "Suelta la imagen aquí o elige archivo"}
        </p>
        <p id={`${inputId}-hint`} className={`max-w-sm ${s.hint}`}>
          Máx. 2 MB · JPG, PNG o WebP. Haz clic en esta zona y usa <span className={s.kbd}>Ctrl</span> +{" "}
          <span className={s.kbd}>V</span> para pegar captura o imagen copiada.
        </p>
        <label className={s.button} onClick={(ev) => ev.stopPropagation()}>
          <input
            id={`${inputId}-file`}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(ev) => void onPickFile(ev)}
            disabled={disabled || uploading}
          />
          Elegir archivo…
        </label>
      </div>
      {trimmed ? <PromoImagePreview key={trimmed} raw={trimmed} frameClass={s.previewFrame} /> : null}
    </div>
  );
}
