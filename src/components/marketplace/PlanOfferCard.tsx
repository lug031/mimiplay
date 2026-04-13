import { MimiPlayLogo } from "@/components/brand/MimiPlayLogo";
import { MimiButton } from "@/components/ui/MimiButton";
import type { PlanRow } from "@/lib/catalogApi";
import { isEventCardPresentation, planDisplayTitle, planServiceDetailsForCard } from "@/lib/planMarketing";
import { CATEGORY_LABEL } from "@/lib/orderStatus";
import { formatPlanPrice } from "@/lib/formatPlanPrice";
import { catalogTierRowCaption, checkoutTierChoices, type CheckoutTierChoice } from "@/lib/purchaseOptions";
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

type Props = {
  plan: PlanRow;
  buildCtaTo: (planId: string, optionId?: string) => string;
  ctaLabel: string;
  catalogChrome?: boolean;
};

function usePlanPurchaseSelection(
  p: PlanRow,
  buildCtaTo: Props["buildCtaTo"],
  opts?: { deferOptionToCheckout?: boolean },
) {
  const catalogKey = JSON.stringify(p.purchaseTierCatalog);
  const choices = useMemo(
    () => checkoutTierChoices(p.purchaseTierCatalog, { durationDays: p.durationDays, pricePen: p.pricePen }),
    [p.planId, p.durationDays, p.pricePen, catalogKey],
  );
  /** Índice en `choices` (orden grupos × tiers). Evita colisiones si dos tiers repiten el mismo `id`. */
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [p.planId, catalogKey]);

  useEffect(() => {
    setSelectedIndex((i) => {
      if (choices.length === 0) return 0;
      return Math.min(Math.max(0, i), choices.length - 1);
    });
  }, [choices.length]);

  const selected: CheckoutTierChoice | undefined =
    choices.length > 0 ? (choices[selectedIndex] ?? choices[0]) : undefined;
  const showPicker = choices.length > 1;
  const passOpcion = Boolean(selected && (choices.length > 1 || selected.id !== "_base"));
  const defer = Boolean(opts?.deferOptionToCheckout);
  const ctaHref = useMemo(() => {
    if (defer) return buildCtaTo(p.planId);
    return buildCtaTo(p.planId, passOpcion ? selected?.id : undefined);
  }, [buildCtaTo, defer, p.planId, passOpcion, selected?.id]);
  return { selectedIndex, setSelectedIndex, selected, showPicker, passOpcion, ctaHref, choices };
}

/** Texto de precio en catálogo (sin elegir opción en la tarjeta). */
function catalogPriceSummary(choices: CheckoutTierChoice[]): { priceLine: string; caption: string } {
  if (choices.length === 0) return { priceLine: "—", caption: "" };
  if (choices.length === 1) {
    const c = choices[0]!;
    return { priceLine: formatPlanPrice(c.pricePen), caption: `${c.durationDays} días` };
  }
  const prices = choices.map((x) => x.pricePen);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  if (minP === maxP) {
    return {
      priceLine: formatPlanPrice(minP),
      caption: `${choices.length} opciones · eliges al pedir`,
    };
  }
  return {
    priceLine: `${formatPlanPrice(minP)} – ${formatPlanPrice(maxP)}`,
    caption: "Eliges la opción al hacer el pedido",
  };
}

function PlanCardPromoImagePlaceholder({ pulse, logoClassName = "" }: { pulse: boolean; logoClassName?: string }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-mimi-black ${pulse ? "[&_img]:animate-pulse" : ""}`}
      aria-hidden
    >
      <MimiPlayLogo variant="icon" to={false} heightClass="h-14 w-14 sm:h-16 sm:w-16" className={`opacity-90 ${logoClassName}`} />
    </div>
  );
}

/** Catálogo: franja superior a todo el ancho (tarjeta vertical: imagen → texto → botón). */
const catalogPromoShellOuter =
  "w-full shrink-0 border-b border-white/10 bg-gradient-to-b from-mimi-black via-mimi-black to-mimi-void";
const catalogPromoShellPad = "flex w-full items-stretch justify-center p-0";
const catalogPromoShellFrame =
  "relative isolate flex aspect-video w-full items-stretch justify-center overflow-hidden bg-mimi-black/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_80%_65%_at_50%_40%,rgba(255,255,255,0.06),transparent_62%)]";

function CatalogPromoImageShell({ children }: { children: ReactNode }) {
  return (
    <div className={catalogPromoShellOuter}>
      <div className={catalogPromoShellPad}>
        <div className={catalogPromoShellFrame}>{children}</div>
      </div>
    </div>
  );
}

export function PlanCardPromoImage({
  raw,
  title,
  maxClass = "max-h-56",
  catalogChrome = false,
}: {
  raw: string;
  title: string;
  maxClass?: string;
  /** Imagen tipo tarjeta de catálogo: esquinas superiores redondeadas y relación fija. */
  catalogChrome?: boolean;
}) {
  const trimmed = raw.trim();
  const isHttp = /^https?:\/\//i.test(trimmed);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => (isHttp ? trimmed : null));
  const [urlState, setUrlState] = useState<"pending" | "ready" | "fail">(() =>
    !trimmed ? "fail" : isHttp ? "ready" : "pending",
  );
  const [imgLoaded, setImgLoaded] = useState(false);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
    setImgLoaded(false);
    if (!trimmed) {
      setResolvedSrc(null);
      setUrlState("fail");
      return;
    }
    if (isHttp) {
      setResolvedSrc(trimmed);
      setUrlState("ready");
      return;
    }
    setUrlState("pending");
    setResolvedSrc(null);
    let cancelled = false;
    getUrl({ path: trimmed })
      .then(({ url }) => {
        if (!cancelled) {
          setResolvedSrc(url.toString());
          setUrlState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedSrc(null);
          setUrlState("fail");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [trimmed, isHttp]);

  const showPhoto = urlState === "ready" && Boolean(resolvedSrc) && imgLoaded && !broken;
  const pulseLogo =
    urlState === "pending" || (Boolean(resolvedSrc) && !imgLoaded && !broken);

  if (catalogChrome) {
    return (
      <CatalogPromoImageShell>
        {resolvedSrc && urlState === "ready" ? (
          <img
            src={resolvedSrc}
            alt={title}
            className={`absolute inset-0 z-[1] h-full w-full object-cover object-center transition-opacity duration-300 ${showPhoto ? "opacity-100" : "opacity-0"}`}
            onLoad={() => {
              setImgLoaded(true);
              setBroken(false);
            }}
            onError={() => {
              setBroken(true);
              setImgLoaded(false);
            }}
          />
        ) : null}
        {!showPhoto ? (
          <div
            className={`pointer-events-none absolute inset-0 z-[2] flex items-center justify-center p-4 ${pulseLogo ? "[&_img]:animate-pulse" : ""}`}
            aria-hidden
          >
            <MimiPlayLogo variant="icon" to={false} heightClass="h-16 w-16 sm:h-20 sm:w-20" className="opacity-75" />
          </div>
        ) : null}
      </CatalogPromoImageShell>
    );
  }

  return (
    <div className={`relative min-h-36 border-b border-white/10 bg-mimi-black sm:min-h-40`}>
      {!showPhoto ? <PlanCardPromoImagePlaceholder pulse={pulseLogo} /> : null}
      {resolvedSrc && urlState === "ready" ? (
        <img
          src={resolvedSrc}
          alt={title}
          className={`relative z-[1] w-full object-cover object-center transition-opacity duration-300 ${maxClass} ${showPhoto ? "opacity-100" : "opacity-0"}`}
          onLoad={() => {
            setImgLoaded(true);
            setBroken(false);
          }}
          onError={() => {
            setBroken(true);
            setImgLoaded(false);
          }}
        />
      ) : null}
    </div>
  );
}

function PlanOfferCardStandard({ plan: p, buildCtaTo, ctaLabel, catalogChrome }: Props) {
  const { selectedIndex, setSelectedIndex, selected, showPicker, ctaHref, choices } = usePlanPurchaseSelection(
    p,
    buildCtaTo,
    { deferOptionToCheckout: Boolean(catalogChrome) },
  );
  const title = planDisplayTitle(p);
  const serviceDetails = planServiceDetailsForCard(p);
  const rawImg = p.promoImageUrl?.trim() ?? "";
  const stock = p.stockNotice?.trim();
  const warn = p.warningNotice?.trim();
  const extra = p.extraContent?.trim();
  const imageBlock: ReactNode = rawImg ? <PlanCardPromoImage key={rawImg} raw={rawImg} title={title} /> : null;
  const hasRich = Boolean(rawImg) || serviceDetails || stock || warn || extra;
  /** Catálogo público: tarjeta vertical (imagen arriba → datos → botón); tier en /pedido/nuevo. */
  const adLike = Boolean(catalogChrome);

  if (adLike) {
    const priceSummary = catalogPriceSummary(choices);
    return (
      <article className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-mimi border border-white/10 bg-mimi-elevated shadow-sm transition hover:border-white/15">
        {rawImg ? (
          <PlanCardPromoImage key={rawImg} catalogChrome raw={rawImg} title={title} />
        ) : (
          <CatalogPromoImageShell>
            <div className="relative z-[1] flex h-full min-h-0 w-full items-center justify-center p-4" aria-hidden>
              <MimiPlayLogo variant="icon" to={false} heightClass="h-16 w-16 sm:h-20 sm:w-20" className="opacity-75" />
            </div>
          </CatalogPromoImageShell>
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5 p-4">
          <div className="shrink-0">
            <h3 className="text-base font-extrabold leading-snug text-white">{title}</h3>
            <p className="mt-1 text-[11px] leading-snug text-mimi-muted">
              {p.platformName}
              {choices.length > 1 ? " · Opción al hacer el pedido" : ` · ${p.durationDays} días`}
              {p.planVariantKey ? ` · ${p.planVariantKey}` : ""}
            </p>
          </div>

          <div className="h-[9.5rem] shrink-0 overflow-y-auto rounded-mimi border border-white/10 bg-mimi-black/40 px-3 py-2 text-xs leading-relaxed text-white/80 [word-break:break-word] sm:h-40 sm:text-[13px]">
            {serviceDetails ? <div className="whitespace-pre-wrap">{serviceDetails}</div> : null}
            {stock ? (
              <p className="mt-2 inline-flex w-fit rounded-mimi border border-white/12 bg-mimi-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/75">
                {stock}
              </p>
            ) : null}
            {warn ? (
              <aside className="mt-2 rounded-mimi border border-white/10 bg-mimi-black/50 px-2.5 py-2 text-[11px] leading-relaxed text-white/85">
                <span className="font-bold text-white">Aviso: </span>
                {warn}
              </aside>
            ) : null}
            {extra ? (
              <div className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-white/75 sm:text-xs">{extra}</div>
            ) : null}
          </div>

          <div className="mt-auto flex shrink-0 flex-col gap-3 border-t border-white/10 pt-3">
            <div>
              <p className="text-lg font-extrabold tabular-nums tracking-tight text-white">{priceSummary.priceLine}</p>
              {priceSummary.caption ? (
                <p className="mt-1 text-[10px] font-semibold uppercase leading-tight text-mimi-muted">{priceSummary.caption}</p>
              ) : null}
            </div>
            <MimiButton to={ctaHref} variant="primary" className="w-full !rounded-mimi !py-2.5 !text-sm !font-extrabold">
              {ctaLabel}
            </MimiButton>
          </div>
        </div>
      </article>
    );
  }

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
              <div className="mt-2 space-y-4">
                {(() => {
                  let idx = 0;
                  return p.purchaseTierCatalog.groups.map((g) => (
                    <div key={g.id} className="space-y-2">
                      {g.title.trim() || g.emoji ? (
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-white/70">
                          {g.emoji ? <span className="mr-1 font-normal normal-case">{g.emoji}</span> : null}
                          {g.title.trim()}
                        </p>
                      ) : null}
                      {g.tiers.map((c) => {
                        const i = idx++;
                        return (
                          <label
                            key={`${p.planId}-mk-${i}`}
                            className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/10 px-2.5 py-2 hover:bg-white/5 has-[:checked]:border-amber-400/50 has-[:checked]:bg-amber-500/10"
                          >
                            <input
                              type="radio"
                              className="mt-1"
                              name={`purchase-${p.planId}`}
                              value={i}
                              checked={selectedIndex === i}
                              onChange={() => setSelectedIndex(i)}
                            />
                            <span className="min-w-0 text-sm leading-snug">
                              <span className="font-bold text-white">{catalogTierRowCaption(c)}</span>
                              <span className="mt-0.5 block text-xs text-white/60">
                                {formatPlanPrice(c.pricePen)} · {c.durationDays} días
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            </fieldset>
          ) : null}

          {serviceDetails ? (
            <div className="text-sm leading-relaxed text-white/75 whitespace-pre-wrap [word-break:break-word]">{serviceDetails}</div>
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
  const { selectedIndex, setSelectedIndex, selected, showPicker, ctaHref, choices } = usePlanPurchaseSelection(
    p,
    buildCtaTo,
    { deferOptionToCheckout: Boolean(catalogChrome) },
  );
  const title = planDisplayTitle(p);
  const serviceDetails = planServiceDetailsForCard(p);
  const rawImg = p.promoImageUrl?.trim() ?? "";
  const stock = p.stockNotice?.trim();
  const warn = p.warningNotice?.trim();
  const extra = p.extraContent?.trim();
  const imageBlock: ReactNode = rawImg ? (
    <PlanCardPromoImage key={rawImg} raw={rawImg} title={title} maxClass="max-h-72 sm:max-h-96" />
  ) : null;
  const adLike = Boolean(catalogChrome);

  if (adLike) {
    const priceSummary = catalogPriceSummary(choices);
    return (
      <article className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-mimi border border-white/10 bg-mimi-elevated shadow-sm transition hover:border-white/15">
        {rawImg ? (
          <PlanCardPromoImage key={rawImg} catalogChrome raw={rawImg} title={title} />
        ) : (
          <CatalogPromoImageShell>
            <div className="relative z-[1] flex h-full min-h-0 w-full items-center justify-center p-4" aria-hidden>
              <MimiPlayLogo variant="icon" to={false} heightClass="h-16 w-16 sm:h-20 sm:w-20" className="opacity-75" />
            </div>
          </CatalogPromoImageShell>
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5 p-4">
          <div className="shrink-0">
            <span className="mb-2 inline-flex w-fit rounded-mimi border border-white/12 bg-mimi-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-mimi-muted">
              Evento
            </span>
            <h3 className="text-base font-extrabold leading-snug text-white">{title}</h3>
            <p className="mt-1 text-[11px] leading-snug text-mimi-muted">
              {p.platformName}
              {choices.length > 1 ? " · Opción al hacer el pedido" : ` · ${p.durationDays} días`}
            </p>
          </div>

          <div className="h-[9.5rem] shrink-0 overflow-y-auto rounded-mimi border border-white/10 bg-mimi-black/40 px-3 py-2 text-xs leading-relaxed text-white/80 [word-break:break-word] sm:h-40 sm:text-[13px]">
            {warn ? (
              <aside className="rounded-mimi border border-white/10 bg-mimi-black/50 px-2 py-2 text-[11px] leading-relaxed text-white/85 whitespace-pre-wrap">
                {warn}
              </aside>
            ) : null}
            {stock ? (
              <p className="mt-2 inline-flex w-fit rounded-mimi border border-white/12 bg-mimi-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/75">
                {stock}
              </p>
            ) : null}
            {extra ? (
              <div className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-white/80 sm:text-xs">{extra}</div>
            ) : (
              <p className="text-[11px] text-mimi-subtle">
                Añade el cuerpo del evento en <strong className="text-white/70">Editar anuncio</strong> (admin).
              </p>
            )}
            {serviceDetails ? (
              <div className="mt-2 border-t border-white/10 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">Detalles del servicio</p>
                <div className="mt-1 whitespace-pre-wrap text-white/80">{serviceDetails}</div>
              </div>
            ) : null}
          </div>

          <div className="mt-auto flex shrink-0 flex-col gap-3 border-t border-white/10 pt-3">
            <div>
              <p className="text-lg font-extrabold tabular-nums tracking-tight text-white">{priceSummary.priceLine}</p>
              {priceSummary.caption ? (
                <p className="mt-1 text-[10px] font-semibold uppercase leading-tight text-mimi-muted">{priceSummary.caption}</p>
              ) : null}
              <p className="mt-2 text-[10px] leading-snug text-mimi-subtle">
                Texto informativo. Precio y vigencia al formalizar el pedido.
              </p>
            </div>
            <MimiButton to={ctaHref} variant="primary" className="w-full !rounded-mimi !py-2.5 !text-sm !font-extrabold">
              {ctaLabel}
            </MimiButton>
          </div>
        </div>
      </article>
    );
  }

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
              <div className="mt-2 space-y-4">
                {(() => {
                  let idx = 0;
                  return p.purchaseTierCatalog.groups.map((g) => (
                    <div key={g.id} className="space-y-2">
                      {g.title.trim() || g.emoji ? (
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-orange-100/75">
                          {g.emoji ? <span className="mr-1 font-normal normal-case">{g.emoji}</span> : null}
                          {g.title.trim()}
                        </p>
                      ) : null}
                      {g.tiers.map((c) => {
                        const i = idx++;
                        return (
                          <label
                            key={`${p.planId}-ev-${i}`}
                            className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/10 px-2.5 py-2 hover:bg-white/5 has-[:checked]:border-orange-400/55 has-[:checked]:bg-orange-500/15"
                          >
                            <input
                              type="radio"
                              className="mt-1"
                              name={`purchase-event-${p.planId}`}
                              value={i}
                              checked={selectedIndex === i}
                              onChange={() => setSelectedIndex(i)}
                            />
                            <span className="min-w-0 text-sm leading-snug">
                              <span className="font-bold text-white">{catalogTierRowCaption(c)}</span>
                              <span className="mt-0.5 block text-xs text-white/65">
                                {formatPlanPrice(c.pricePen)} · {c.durationDays} días
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ));
                })()}
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
              En admin, <strong className="text-white/80">Editar</strong> el anuncio: tipo Evento y cuerpo del anuncio (varias plataformas en el texto).
            </p>
          )}

          {serviceDetails ? (
            <details className="rounded-mimi border border-white/10 bg-mimi-black/30 text-sm text-white/80">
              <summary className="cursor-pointer px-3 py-2 font-bold text-white/90 hover:bg-white/5">Detalles del servicio</summary>
              <div className="border-t border-white/10 px-3 py-3 whitespace-pre-wrap [word-break:break-word]">{serviceDetails}</div>
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
