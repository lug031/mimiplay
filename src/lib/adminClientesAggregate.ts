export type ClientPeriodKey = "all" | "30" | "90" | "365";

export type ClientOrderInput = {
  id: string;
  status?: string | null;
  owner?: string | null;
  payerFullName?: string | null;
  chosenPricePen?: number | null;
  createdAt?: string | null;
  servicePlanID: string;
};

export type ClientOrderTimelineItem = {
  id: string;
  createdAt: string | null;
  status: string | null;
  chosenPricePen: number | null;
  servicePlanID: string;
};

export type ClientAggregateRow = {
  key: string;
  hasCognitoOwner: boolean;
  ownerSub: string;
  payerLabel: string;
  orderCount: number;
  fulfilledCount: number;
  inProgressCount: number;
  cancelledCount: number;
  revenuePen: number;
  lastOrderAt: string | null;
  firstOrderAt: string | null;
  lastOrderId: string;
  /** Pedidos del titular en el periodo agregado, orden cronológico (más antiguo primero). */
  orders: ClientOrderTimelineItem[];
};

export function clientGroupKey(o: ClientOrderInput): string {
  const owner = (o.owner ?? "").trim();
  if (owner) return `sub:${owner}`;
  const name = (o.payerFullName ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return `guest:${name || "sin_nombre"}`;
}

export function periodStartMs(period: ClientPeriodKey): number | null {
  if (period === "all") return null;
  const days = period === "30" ? 30 : period === "90" ? 90 : 365;
  return Date.now() - days * 86_400_000;
}

export function orderInPeriod(o: ClientOrderInput, startMs: number | null): boolean {
  if (startMs == null) return true;
  const c = o.createdAt?.trim();
  if (!c) return true;
  const t = Date.parse(c);
  if (!Number.isFinite(t)) return true;
  return t >= startMs;
}

export function priceNum(v: number | null | undefined): number {
  if (v == null || !Number.isFinite(v)) return 0;
  return v;
}

export function aggregateClientOrders(orders: ClientOrderInput[]): Map<string, ClientAggregateRow> {
  const map = new Map<
    string,
    {
      key: string;
      hasCognitoOwner: boolean;
      ownerSub: string;
      payerLabel: string;
      payerLabelAt: number;
      orderCount: number;
      fulfilledCount: number;
      inProgressCount: number;
      cancelledCount: number;
      revenuePen: number;
      lastOrderAt: string | null;
      lastOrderAtMs: number;
      firstOrderAt: string | null;
      firstOrderAtMs: number;
      lastOrderId: string;
      orders: ClientOrderTimelineItem[];
    }
  >();

  for (const o of orders) {
    const key = clientGroupKey(o);
    const created = o.createdAt ?? null;
    const createdMs = created ? Date.parse(created) : 0;
    const st = o.status ?? "";
    const fulfilled = st === "FULFILLED";
    const cancelled = st === "CANCELLED";
    const pen = priceNum(o.chosenPricePen);
    const ownerTrim = (o.owner ?? "").trim();
    const payer = (o.payerFullName ?? "").trim() || "—";
    const hasOwner = Boolean(ownerTrim);

    let acc = map.get(key);
    if (!acc) {
      acc = {
        key,
        hasCognitoOwner: hasOwner,
        ownerSub: ownerTrim,
        payerLabel: payer,
        payerLabelAt: Number.isFinite(createdMs) ? createdMs : 0,
        orderCount: 0,
        fulfilledCount: 0,
        inProgressCount: 0,
        cancelledCount: 0,
        revenuePen: 0,
        lastOrderAt: null,
        lastOrderAtMs: -Infinity,
        firstOrderAt: null,
        firstOrderAtMs: Infinity,
        lastOrderId: o.id,
        orders: [],
      };
      map.set(key, acc);
    } else if (hasOwner && !acc.hasCognitoOwner) {
      acc.hasCognitoOwner = true;
      acc.ownerSub = ownerTrim;
    }

    acc.orderCount += 1;
    if (fulfilled) acc.fulfilledCount += 1;
    else if (cancelled) acc.cancelledCount += 1;
    else acc.inProgressCount += 1;
    if (fulfilled) acc.revenuePen += pen;

    acc.orders.push({
      id: o.id,
      createdAt: o.createdAt ?? null,
      status: o.status ?? null,
      chosenPricePen: o.chosenPricePen ?? null,
      servicePlanID: o.servicePlanID,
    });

    if (Number.isFinite(createdMs)) {
      if (createdMs >= acc.payerLabelAt) {
        acc.payerLabelAt = createdMs;
        acc.payerLabel = payer;
      }
      if (createdMs >= acc.lastOrderAtMs) {
        acc.lastOrderAtMs = createdMs;
        acc.lastOrderAt = created;
        acc.lastOrderId = o.id;
      }
      if (createdMs < acc.firstOrderAtMs) {
        acc.firstOrderAtMs = createdMs;
        acc.firstOrderAt = created;
      }
    }
  }

  const out = new Map<string, ClientAggregateRow>();
  for (const [k, acc] of map) {
    const sortedOrders = [...acc.orders].sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return ta - tb;
      return a.id.localeCompare(b.id);
    });
    out.set(k, {
      key: k,
      hasCognitoOwner: acc.hasCognitoOwner,
      ownerSub: acc.ownerSub,
      payerLabel: acc.payerLabel,
      orderCount: acc.orderCount,
      fulfilledCount: acc.fulfilledCount,
      inProgressCount: acc.inProgressCount,
      cancelledCount: acc.cancelledCount,
      revenuePen: acc.revenuePen,
      lastOrderAt: acc.lastOrderAt,
      firstOrderAt: acc.firstOrderAt,
      lastOrderId: acc.lastOrderId,
      orders: sortedOrders,
    });
  }
  return out;
}
