import { useAdminSnackbar } from "@/components/admin/AdminSnackbar";
import { MimiButton } from "@/components/ui/MimiButton";
import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminDataClient } from "@/lib/dataClient";
import { claimStatusBadgeTone, claimStatusLabel } from "@/lib/orderStatus";
import { getUrl } from "aws-amplify/storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type ClaimRow = {
  id: string;
  orderID: string;
  ownerSub: string;
  detail: string;
  status: string | null | undefined;
  adminResponse: string | null | undefined;
  attendedAt: string | null | undefined;
  createdAt: string | null | undefined;
  imageStorageKey: string | null | undefined;
  planLabel: string;
};

type FilterKey = "ALL" | "PENDING" | "ATTENDED";

async function enrichPlanLabel(orderID: string): Promise<string> {
  try {
    const or = await adminDataClient.models.CustomerOrder.get({ id: orderID });
    const o = or.data;
    if (!o?.servicePlanID) return "—";
    const pr = await adminDataClient.models.ServicePlan.get({ id: o.servicePlanID });
    const p = pr.data;
    if (!p) return "—";
    const plr = await adminDataClient.models.Platform.get({ id: p.platformID });
    return plr.data ? `${plr.data.name} · ${p.name}` : p.name;
  } catch {
    return "—";
  }
}

export function AdminClaimsPage() {
  const { showSnackbar } = useAdminSnackbar();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ClaimRow[]>([]);
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [openId, setOpenId] = useState<string | null>(null);
  const [responseDraft, setResponseDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageUrlByClaim, setImageUrlByClaim] = useState<Record<string, string | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, errors } = await adminDataClient.models.CustomerClaim.list();
      if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
      const list: ClaimRow[] = [];
      for (const c of data ?? []) {
        if (!c.id || !c.orderID) continue;
        const ownerSub = (c as { owner?: string }).owner ?? "—";
        const planLabel = await enrichPlanLabel(c.orderID);
        list.push({
          id: c.id,
          orderID: c.orderID,
          ownerSub,
          detail: c.detail ?? "",
          status: c.status,
          adminResponse: c.adminResponse,
          attendedAt: c.attendedAt,
          createdAt: (c as { createdAt?: string }).createdAt,
          imageStorageKey: c.imageStorageKey,
          planLabel,
        });
      }
      list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      setRows(list);
      const imgMap: Record<string, string | null> = {};
      for (const r of list) {
        const k = r.imageStorageKey?.trim();
        if (!k) continue;
        try {
          const u = await getUrl({ path: k });
          imgMap[r.id] = u.url.toString();
        } catch {
          imgMap[r.id] = null;
        }
      }
      setImageUrlByClaim(imgMap);
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "Error al cargar reclamos", "error");
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  const openRow = rows.find((r) => r.id === openId) ?? null;

  useEffect(() => {
    if (openRow) {
      setResponseDraft(openRow.adminResponse?.trim() ?? "");
    } else {
      setResponseDraft("");
    }
  }, [openRow]);

  async function saveAttended() {
    if (!openRow) return;
    const text = responseDraft.trim();
    if (!text) {
      showSnackbar("Escribe una respuesta para el cliente.", "error");
      return;
    }
    setSaving(true);
    try {
      const { errors } = await adminDataClient.models.CustomerClaim.update({
        id: openRow.id,
        status: "ATTENDED",
        adminResponse: text,
        attendedAt: new Date().toISOString(),
      });
      if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
      showSnackbar("Reclamo marcado como atendido.", "success");
      setOpenId(null);
      await load();
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-mimi-black">Reclamos</h1>
      <p className="mt-2 max-w-3xl text-sm text-mimi-subtle">
        Incidencias enviadas por clientes desde su cuenta. Responde y marca como atendido; el cliente verá la respuesta en{" "}
        <strong className="text-mimi-black">Mis reclamos</strong>.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="text-sm font-bold text-mimi-black">Estado</label>
        <select
          className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterKey)}
        >
          <option value="ALL">Todos</option>
          <option value="PENDING">Pendientes</option>
          <option value="ATTENDED">Atendidos</option>
        </select>
        <MimiButton variant="outline" className="!text-xs sm:!text-sm" onClick={() => void load()}>
          Actualizar
        </MimiButton>
      </div>

      {loading && <MimiLoadingState tone="light" layout="inline" className="mt-6" />}

      {!loading && (
        <div className="mt-8 overflow-x-auto rounded-xl border border-mimi-black/12 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-mimi-black/12 bg-mimi-black/[0.06]">
              <tr>
                <th className="px-3 py-2 font-bold">Fecha</th>
                <th className="px-3 py-2 font-bold">Pedido / anuncio</th>
                <th className="px-3 py-2 font-bold">Cliente (sub)</th>
                <th className="px-3 py-2 font-bold">Estado</th>
                <th className="px-3 py-2 font-bold" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-mimi-black/12 last:border-0">
                  <td className="px-3 py-2 text-xs text-mimi-subtle whitespace-nowrap">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString("es-PE") : "—"}
                  </td>
                  <td className="max-w-[14rem] px-3 py-2">
                    <div className="font-medium text-mimi-black">{r.planLabel}</div>
                    <div className="font-mono text-[11px] text-mimi-muted">{r.orderID.slice(0, 8)}…</div>
                  </td>
                  <td className="max-w-[10rem] truncate px-3 py-2 font-mono text-xs text-mimi-subtle" title={r.ownerSub}>
                    {r.ownerSub.length > 20 ? `${r.ownerSub.slice(0, 18)}…` : r.ownerSub}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge tone={claimStatusBadgeTone(r.status)} variant="onLight">
                      {claimStatusLabel(r.status)}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="font-bold text-mimi-black hover:underline"
                      onClick={() => setOpenId(r.id)}
                    >
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length ? (
            <p className="px-4 py-8 text-center text-sm text-mimi-muted">No hay reclamos con este filtro.</p>
          ) : null}
        </div>
      )}

      {openRow ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-mimi-black/50 p-4 sm:items-center"
          role="presentation"
          onClick={() => setOpenId(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-mimi-black/12 bg-white p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-mimi-black/10 pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-mimi-black">Gestionar reclamo</h2>
                <p className="mt-1 text-xs text-mimi-subtle">
                  Pedido{" "}
                  <Link
                    to={`/admin/pedidos?order=${encodeURIComponent(openRow.orderID)}`}
                    className="font-mono font-bold text-mimi-black underline"
                  >
                    {openRow.orderID.slice(0, 8)}…
                  </Link>
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-sm font-bold text-mimi-subtle hover:bg-mimi-black/[0.04] hover:text-mimi-black"
                onClick={() => setOpenId(null)}
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-[11px] font-extrabold uppercase text-mimi-muted">Anuncio</p>
                <p className="mt-1 font-semibold text-mimi-black">{openRow.planLabel}</p>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase text-mimi-muted">Mensaje del cliente</p>
                <p className="mt-1 whitespace-pre-wrap text-mimi-black">{openRow.detail}</p>
              </div>
              {imageUrlByClaim[openRow.id] ? (
                <div>
                  <p className="text-[11px] font-extrabold uppercase text-mimi-muted">Imagen</p>
                  <a
                    href={imageUrlByClaim[openRow.id]!}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-sm font-bold text-mimi-black underline"
                  >
                    Abrir imagen adjunta
                  </a>
                </div>
              ) : null}

              {openRow.status === "ATTENDED" && openRow.attendedAt ? (
                <p className="text-xs text-mimi-muted">
                  Ya atendido el {new Date(openRow.attendedAt).toLocaleString("es-PE")}. Puedes editar la respuesta
                  volviendo a guardar.
                </p>
              ) : null}

              <div>
                <label htmlFor="claim-admin-response" className="text-[11px] font-extrabold uppercase text-mimi-muted">
                  Respuesta al cliente
                </label>
                <textarea
                  id="claim-admin-response"
                  rows={5}
                  value={responseDraft}
                  onChange={(e) => setResponseDraft(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-mimi-black/15 px-3 py-2 text-sm text-mimi-black"
                  placeholder="Explica la resolución o los siguientes pasos."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <MimiButton
                  variant="outline"
                  className="!text-sm"
                  disabled={saving}
                  onClick={() => void saveAttended()}
                >
                  {saving ? "Guardando…" : "Guardar y marcar atendido"}
                </MimiButton>
                <button
                  type="button"
                  className="rounded-full border border-mimi-black/15 px-4 py-2 text-sm font-bold text-mimi-subtle hover:text-mimi-black"
                  onClick={() => setOpenId(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
