import { MimiButton } from "@/components/ui/MimiButton";
import type { PlanRow } from "@/lib/catalogApi";
import { isEventCardPresentation, planDisplayTitle } from "@/lib/planMarketing";
import { CATEGORY_LABEL } from "@/lib/orderStatus";
import { formatPlanPrice } from "@/lib/formatPlanPrice";
import { purchaseChoicesForPlan } from "@/lib/purchaseOptions";
import { getUrl } from "aws-amplify/storage";
import { useEffect, useMemo, useState, type ReactNode } from "react";

function initials(name: string) {
  const t = name.trim();
  if (!t) return "??";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}

type SpecLine = { label: string; value: string };

function collectSpecs(p: PlanRow): SpecLine[] {
  const lines: SpecLine[] = [];
  const acc = p.accessSummary?.trim();
  const qual = p.qualitySummary?.trim();
  const dev = p.devicesSummary?.trim();
  const comp = p.compatibilitySummary?.trim();
  if (acc) lines.push({ label: "Acceso", value: acc });
  if (qual) lines.push({ label: "Calidad", value: qual });
  if (dev) lines.push({ label: "Dispositivos", value: dev });
  if (comp) lines.push({ label: "Compatibilidad", value: comp });
  return lines;
}

type Props = {
  plan: PlanRow;
  buildCtaTo: (planId: string, optionId?: string) => string;
  ctaLabel: string;
  catalogChrome?: boolean;
};

function usePlanPurchaseSelection(p: PlanRow, buildCtaTo: Props["buildCtaTo"]) {
  const poKey = JSON.stringify(p.purchaseOptions ?? null);
  const choices = useMemo(
    () => purchaseChoicesForPlan({ purchaseOptions: p.purchaseOptions, durationDays: p.durationDays, pricePen: p.pricePen }),
    [p.planId, p.durationDays, p.pricePen, poKey],
  );
  const [selectedId, setSelectedId] = useState("");
  useEffect(() => {
    setSelectedId(choices[0]?.id ?? "");
  }, [p.planId, poKey, choices]);
  const selected = choices.find((c) => c.id === selectedId) ?? choices[0];
  const showPicker = choices.length > 1;
  const passOpcion = Boolean(selected && (choices.length > 1 || selected.id !== "_base"));
  const ctaHref = useMemo(
    () => buildCtaTo(p.planId, passOpcion ? selected?.id : undefined),
    [buildCtaTo, p.planId, passOpcion, selected?.id],
  );
  return { choices, selectedId, setSelectedId, selected, showPicker, passOpcion, ctaHref };
}

function PlanCardPromoImage({
  raw,
  title,
  maxClass = "max-h-56",
}: {
  raw: string;
  title: string;
  maxClass?: string;
}) {
  const isHttp = /^https?:\/\//i.test(raw);
  const [src, setSrc] = useState<string | null>(() => (isHttp ? raw : null));
  const [broken, setBroken] = useState(false);

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

  if (!src || broken) return null;
  return (
    <div className="relative border-b border-white/10 bg-mimi-black">
      <img
        src={src}
        alt={title}
        className={`w-full object-cover object-center ${maxClass}`}
        onLoad={() => setBroken(false)}
        onError={() => setBroken(true)}
      />
    </div>
  );
}

function PlanOfferCardStandard({ plan: p, buildCtaTo, ctaLabel, catalogChrome }: Props) {
  const { choices, selectedId, setSelectedId, selected, showPicker, ctaHref } = usePlanPurchaseSelection(p, buildCtaTo);
  const title = planDisplayTitle(p);
  const specs = collectSpecs(p);
  const rawImg = p.promoImageUrl?.trim() ?? "";
  const stock = p.stockNotice?.trim();
  const warn = p.warningNotice?.trim();
  const extra = p.extraContent?.trim();
  const imageBlock: ReactNode = rawImg ? <PlanCardPromoImage key={rawImg} raw={rawImg} title={title} /> : null;
  const hasRich = Boolean(rawImg) || specs.length > 0 || stock || warn || extra;
  /** Catálogo público: menos cromo de “app”, más parecido al anuncio del chat. */
  const adLike = Boolean(catalogChrome);

  return (
    <article className="flex flex-col overflow-hidden rounded-mimi border border-white/10 bg-mimi-elevated shadow-md transition hover:border-white/20 hover:shadow-lg">
      {imageBlock}

      <div className="flex min-w-0 flex-1 flex-col gap-0 sm:flex-row sm:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className={`flex items-start gap-3 ${adLike ? "gap-0" : ""}`}>
            {!adLike ? (
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-mimi-void text-sm font-extrabold text-white"
                aria-hidden
              >
                {initials(p.platformName)}
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-extrabold leading-snug text-white sm:text-lg">{title}</h3>
              {adLike ? (
                hasRich ? (
                  <p className="mt-1 text-xs text-white/45">
                    {showPicker ? "Varias opciones de precio y vigencia" : `${p.durationDays} días`}
                    {p.planVariantKey ? ` · ${p.planVariantKey}` : ""}
                  </p>
                ) : (
                  <>
                    <p className="mt-0.5 text-sm font-semibold text-white/70">{p.platformName}</p>
                    <p className="mt-1 text-xs text-white/40">
                      {showPicker ? "Varias opciones de precio y vigencia" : `${p.durationDays} días`}
                      {p.planVariantKey ? ` · ${p.planVariantKey}` : ""}
                    </p>
                  </>
                )
              ) : (
                <>
                  <p className="mt-0.5 text-sm font-semibold text-white/70">{p.platformName}</p>
                  {!hasRich ? (
                    <p className="mt-1 text-xs text-mimi-muted">
                      {showPicker ? "Varias opciones · elige la que comprarás" : `${p.durationDays} días`} ·{" "}
                      {p.category ? CATEGORY_LABEL[p.category] ?? p.category : "Servicio"}
                      {p.planVariantKey ? ` · ${p.planVariantKey}` : ""}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-mimi-muted">
                      Anuncio publicado · {showPicker ? "varias opciones · elige la que comprarás" : `${p.durationDays} días`} ·{" "}
                      {p.category ? CATEGORY_LABEL[p.category] ?? p.category : "Servicio"}
                      {p.planVariantKey ? ` · ${p.planVariantKey}` : ""}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {showPicker ? (
            <fieldset className="rounded-mimi border border-white/10 bg-mimi-black/35 p-3">
              <legend className="px-1 text-[10px] font-extrabold uppercase tracking-wide text-white/65">Elige qué compras</legend>
              <div className="mt-2 space-y-2">
                {choices.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/10 px-2.5 py-2 hover:bg-white/5 has-[:checked]:border-amber-400/50 has-[:checked]:bg-amber-500/10"
                  >
                    <input
                      type="radio"
                      className="mt-1"
                      name={`purchase-${p.planId}`}
                      value={c.id}
                      checked={selectedId === c.id}
                      onChange={() => setSelectedId(c.id)}
                    />
                    <span className="min-w-0 text-sm leading-snug">
                      <span className="font-bold text-white">{c.label}</span>
                      <span className="mt-0.5 block text-xs text-white/60">
                        {formatPlanPrice(c.pricePen)} · {c.durationDays} días
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {specs.length > 0 ? (
            <dl className="space-y-1.5 text-sm">
              {specs.map((row) => (
                <div key={row.label} className="flex flex-wrap gap-x-2 gap-y-0.5">
                  <dt className="font-bold text-white/85">{row.label}:</dt>
                  <dd className="text-white/75">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {stock ? (
            <p className="inline-flex w-fit rounded-mimi border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-amber-100">
              {stock}
            </p>
          ) : null}

          {warn ? (
            <aside className="rounded-mimi border border-white/15 bg-mimi-black/60 px-3 py-2 text-xs leading-relaxed text-amber-100/95">
              <span className="font-bold text-amber-200">Aviso: </span>
              {warn}
            </aside>
          ) : null}

          {extra ? (
            <div
              className={
                adLike
                  ? "text-sm leading-relaxed text-white/90 whitespace-pre-wrap"
                  : "rounded-mimi border border-white/10 bg-mimi-black/40 px-3 py-2.5 text-xs leading-relaxed text-white/85 whitespace-pre-wrap"
              }
            >
              {extra}
            </div>
          ) : null}

          {!adLike ? (
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-bold text-white/90">
                ✓ Oferta publicada
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-mimi-void px-2.5 py-0.5 text-xs font-bold text-white/70">
                👤 Stock según disponibilidad
              </span>
            </div>
          ) : null}
          {!adLike ? (
            <p className="text-xs text-mimi-muted">
              Venta gestionada por <strong className="text-white/80">MimiPlay</strong> · El precio del botón corresponde a la opción seleccionada (
              {selected ? `${formatPlanPrice(selected.pricePen)} · ${selected.durationDays} días` : "—"}). Entrega sujeta a validación de pago.
            </p>
          ) : (
            <p className="text-[11px] leading-snug text-white/35">
              Precio del botón: la opción marcada (
              {selected ? `${formatPlanPrice(selected.pricePen)} · ${selected.durationDays} días` : "—"}). Otras cifras en el texto son informativas.
            </p>
          )}
          {!adLike && catalogChrome ? (
            <p className="text-xs font-semibold text-white/80">
              <span aria-hidden>⚡</span> Tras validar pago damos acceso según operación
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-center justify-center gap-2 border-t border-white/10 bg-mimi-black px-4 py-5 sm:w-44 sm:border-l sm:border-t-0 sm:py-6">
          <p className="text-2xl font-extrabold tracking-tight text-white">{formatPlanPrice(selected?.pricePen ?? p.pricePen)}</p>
          <p className="text-center text-[10px] font-semibold uppercase leading-tight text-mimi-muted">por {selected?.durationDays ?? p.durationDays} días</p>
          <MimiButton to={ctaHref} variant="primary" className="mt-1 w-full max-w-[9.5rem] !px-3 !py-2 !text-xs">
            {ctaLabel}
          </MimiButton>
        </div>
      </div>
    </article>
  );
}

function PlanOfferCardEvent({ plan: p, buildCtaTo, ctaLabel, catalogChrome }: Props) {
  const { choices, selectedId, setSelectedId, selected, showPicker, ctaHref } = usePlanPurchaseSelection(p, buildCtaTo);
  const title = planDisplayTitle(p);
  const specs = collectSpecs(p);
  const rawImg = p.promoImageUrl?.trim() ?? "";
  const stock = p.stockNotice?.trim();
  const warn = p.warningNotice?.trim();
  const extra = p.extraContent?.trim();
  const imageBlock: ReactNode = rawImg ? (
    <PlanCardPromoImage key={rawImg} raw={rawImg} title={title} maxClass="max-h-72 sm:max-h-96" />
  ) : null;
  const adLike = Boolean(catalogChrome);

  return (
    <article className="flex flex-col overflow-hidden rounded-mimi border border-orange-400/35 bg-mimi-elevated shadow-lg shadow-orange-950/20 ring-1 ring-orange-500/15 transition hover:border-orange-400/50 hover:ring-orange-400/25">
      {imageBlock}

      <div className="flex min-w-0 flex-1 flex-col gap-0 lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-6">
          {!adLike ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange-400/50 bg-orange-500/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-orange-100">
                Evento / promoción
              </span>
              <span className="text-xs text-white/50">{p.platformName}</span>
            </div>
          ) : null}

          <div className={`flex items-start gap-3 ${adLike ? "gap-0" : ""}`}>
            {!adLike ? (
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-orange-400/25 bg-mimi-void text-xs font-extrabold text-orange-100"
                aria-hidden
              >
                {initials(p.platformName)}
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-black leading-tight tracking-tight text-white sm:text-xl">{title}</h3>
              <p className="mt-1 text-xs text-mimi-muted">
                {adLike ? (
                  <>
                    {showPicker ? "Varias opciones · elige la que pagarás" : `${p.durationDays} días · acceso al precio del botón`}
                  </>
                ) : (
                  <>
                    {showPicker ? "Varias opciones · precio según la selección" : `${p.durationDays} días · precio del acceso al pulsar el botón`} ·{" "}
                    {p.category ? CATEGORY_LABEL[p.category] ?? p.category : "Servicio"}
                  </>
                )}
              </p>
            </div>
          </div>

          {showPicker ? (
            <fieldset className="rounded-mimi border border-orange-400/25 bg-mimi-black/40 p-3">
              <legend className="px-1 text-[10px] font-extrabold uppercase tracking-wide text-orange-100/80">Elige qué compras</legend>
              <div className="mt-2 space-y-2">
                {choices.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/10 px-2.5 py-2 hover:bg-white/5 has-[:checked]:border-orange-400/55 has-[:checked]:bg-orange-500/15"
                  >
                    <input
                      type="radio"
                      className="mt-1"
                      name={`purchase-event-${p.planId}`}
                      value={c.id}
                      checked={selectedId === c.id}
                      onChange={() => setSelectedId(c.id)}
                    />
                    <span className="min-w-0 text-sm leading-snug">
                      <span className="font-bold text-white">{c.label}</span>
                      <span className="mt-0.5 block text-xs text-white/65">
                        {formatPlanPrice(c.pricePen)} · {c.durationDays} días
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {warn ? (
            <aside className="rounded-mimi border border-amber-400/45 bg-amber-950/35 px-4 py-3 text-sm font-semibold leading-relaxed text-amber-50 whitespace-pre-wrap">
              {warn}
            </aside>
          ) : null}

          {stock ? (
            <p className="inline-flex w-fit rounded-mimi border border-orange-400/40 bg-orange-500/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-orange-50">
              {stock}
            </p>
          ) : null}

          {extra ? (
            adLike ? (
              <div className="text-sm leading-relaxed text-white/90 whitespace-pre-wrap sm:text-[15px]">{extra}</div>
            ) : (
              <div>
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-orange-200/90">
                  Opciones de transmisión y precios
                </p>
                <div className="rounded-xl border border-white/10 bg-mimi-black/55 px-4 py-4 text-[13px] leading-relaxed text-white/90 shadow-inner whitespace-pre-wrap sm:text-sm">
                  {extra}
                </div>
              </div>
            )
          ) : (
            <p className="text-sm text-mimi-muted">
              En admin, <strong className="text-white/80">Presentación</strong>: tipo Evento y cuerpo del anuncio (varias plataformas en el texto).
            </p>
          )}

          {specs.length > 0 ? (
            <details className="rounded-mimi border border-white/10 bg-mimi-black/30 text-sm text-white/80">
              <summary className="cursor-pointer px-3 py-2 font-bold text-white/90 hover:bg-white/5">
                Detalles técnicos del acceso
              </summary>
              <dl className="space-y-1.5 border-t border-white/10 px-3 py-3">
                {specs.map((row) => (
                  <div key={row.label} className="flex flex-wrap gap-x-2">
                    <dt className="font-bold text-white/75">{row.label}:</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </details>
          ) : null}

          {!adLike ? (
            <p className="text-xs text-mimi-muted">
              Compra gestionada por <strong className="text-white/80">MimiPlay</strong>. El botón aplica a la opción seleccionada (
              {selected ? `${formatPlanPrice(selected.pricePen)} · ${selected.durationDays} días` : "—"}). Otras líneas con precio en el texto son informativas
              salvo que publiques otro anuncio aparte.
            </p>
          ) : (
            <p className="text-[11px] leading-snug text-white/35">
              Precio del botón: la opción marcada (
              {selected ? `${formatPlanPrice(selected.pricePen)} · ${selected.durationDays} días` : "—"}). Otras cifras en el texto son informativas.
            </p>
          )}
          {!adLike && catalogChrome ? (
            <p className="text-xs font-semibold text-orange-100/90">
              <span aria-hidden>⚡</span> Tras validar pago enviamos acceso o enlace según operación
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-center justify-center gap-3 border-t border-orange-500/20 bg-gradient-to-b from-mimi-black to-mimi-black/95 px-5 py-6 lg:w-48 lg:border-l lg:border-t-0">
          <p className="text-3xl font-black tracking-tight text-white">{formatPlanPrice(selected?.pricePen ?? p.pricePen)}</p>
          <p className="text-center text-[10px] font-bold uppercase leading-tight text-orange-100/70">
            Acceso · {selected?.durationDays ?? p.durationDays} días
          </p>
          <MimiButton to={ctaHref} variant="primary" className="w-full max-w-[11rem] !px-4 !py-2.5 !text-sm !font-extrabold">
            {ctaLabel}
          </MimiButton>
        </div>
      </div>
    </article>
  );
}

export function PlanOfferCard(props: Props) {
  if (isEventCardPresentation(props.plan)) {
    return <PlanOfferCardEvent {...props} />;
  }
  return <PlanOfferCardStandard {...props} />;
}
