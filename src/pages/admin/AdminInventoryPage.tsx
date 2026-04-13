import { snackbarVariantForMessage, useAdminSnackbar } from "@/components/admin/AdminSnackbar";
import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { PasswordRevealInput } from "@/components/ui/PasswordReveal";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { adminDataClient } from "@/lib/dataClient";
import { accountStatusLabel } from "@/lib/orderStatus";

type Platform = { id: string; name: string };
type Account = {
  id: string;
  platformID: string;
  internalLabel?: string | null;
  loginEmail: string;
  loginPassword: string;
  profileLabel?: string | null;
  pin?: string | null;
  planVariantKey?: string | null;
  status?: string | null;
};

const STATUSES = ["AVAILABLE", "RESERVED", "ASSIGNED", "EXPIRED", "DISABLED"] as const;

export function AdminInventoryPage() {
  const { showSnackbar } = useAdminSnackbar();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [listPlatformFilter, setListPlatformFilter] = useState<string>("");
  const [listStatusFilter, setListStatusFilter] = useState<string>("");

  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const [platformId, setPlatformId] = useState("");
  const [internalLabel, setInternalLabel] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState("");
  const [pin, setPin] = useState("");
  const [variant, setVariant] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("AVAILABLE");

  async function load() {
    setLoading(true);
    try {
      const [pr, ar] = await Promise.all([
        adminDataClient.models.Platform.list(),
        adminDataClient.models.PlatformAccount.list(),
      ]);
      const plats = (pr.data ?? []).filter((x) => x.id).map((x) => ({ id: x.id!, name: x.name }));
      setPlatforms(plats);
      setAccounts((ar.data ?? []).filter((x) => x.id).map((x) => x as Account));
      setPlatformId((prev) => prev || plats[0]?.id || "");
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "Error al cargar inventario", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      if (listPlatformFilter && a.platformID !== listPlatformFilter) return false;
      if (listStatusFilter && (a.status ?? "") !== listStatusFilter) return false;
      return true;
    });
  }, [accounts, listPlatformFilter, listStatusFilter]);

  const countsByStatus = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of STATUSES) m[s] = 0;
    for (const a of accounts) {
      const k = a.status ?? "AVAILABLE";
      m[k] = (m[k] ?? 0) + 1;
    }
    return m;
  }, [accounts]);

  function resetAccountForm() {
    setEditingAccountId(null);
    setInternalLabel("");
    setEmail("");
    setPassword("");
    setProfile("");
    setPin("");
    setVariant("");
    setStatus("AVAILABLE");
    setPlatformId(platforms[0]?.id ?? "");
  }

  function startEditAccount(a: Account) {
    setEditingAccountId(a.id);
    setPlatformId(a.platformID);
    setInternalLabel(a.internalLabel ?? "");
    setEmail(a.loginEmail);
    setPassword(a.loginPassword);
    setProfile(a.profileLabel ?? "");
    setPin(a.pin ?? "");
    setVariant(a.planVariantKey ?? "");
    const st = a.status;
    setStatus(
      st && (STATUSES as readonly string[]).includes(st) ? (st as (typeof STATUSES)[number]) : "AVAILABLE",
    );
  }

  async function submitAccount(e: FormEvent) {
    e.preventDefault();
    if (!platformId || !email.trim() || !password.trim()) {
      showSnackbar("Plataforma, correo y contraseña son obligatorios.", "warning");
      return;
    }

    if (editingAccountId) {
      const { errors } = await adminDataClient.models.PlatformAccount.update({
        id: editingAccountId,
        platformID: platformId,
        internalLabel: internalLabel.trim() || undefined,
        loginEmail: email.trim(),
        loginPassword: password.trim(),
        profileLabel: profile.trim() || undefined,
        pin: pin.trim() || undefined,
        planVariantKey: variant.trim() || undefined,
        status,
      });
      if (errors?.length) {
        const t = errors.map((x) => x.message).join("; ");
        showSnackbar(t, snackbarVariantForMessage(t));
        return;
      }
      resetAccountForm();
      showSnackbar("Cuenta actualizada.", "success");
      await load();
      return;
    }

    const { errors } = await adminDataClient.models.PlatformAccount.create({
      platformID: platformId,
      internalLabel: internalLabel.trim() || undefined,
      loginEmail: email.trim(),
      loginPassword: password.trim(),
      profileLabel: profile.trim() || undefined,
      pin: pin.trim() || undefined,
      planVariantKey: variant.trim() || undefined,
      status,
    });
    if (errors?.length) {
      const t = errors.map((x) => x.message).join("; ");
      showSnackbar(t, snackbarVariantForMessage(t));
      return;
    }
    resetAccountForm();
    showSnackbar("Cuenta creada.", "success");
    await load();
  }

  async function setAccountStatus(id: string, next: (typeof STATUSES)[number]) {
    try {
      await adminDataClient.models.PlatformAccount.update({ id, status: next });
      showSnackbar(`Estado actualizado: ${accountStatusLabel(next)}`, "success");
      await load();
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "Error al actualizar cuenta", "error");
    }
  }

  async function removeAccount(id: string) {
    if (!window.confirm("¿Eliminar esta cuenta del inventario?")) return;
    try {
      await adminDataClient.models.PlatformAccount.delete({ id });
      showSnackbar("Cuenta eliminada del inventario.", "success");
      await load();
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : "Error al eliminar", "error");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-mimi-black/10 pb-5">
        <h1 className="text-2xl font-extrabold text-mimi-black">Inventario de cuentas</h1>
        <p className="mt-2 max-w-3xl text-sm text-mimi-subtle">Consulta y filtra el stock de las cuentas.</p>
      </header>

      {loading && <MimiLoadingState tone="light" layout="inline" className="mt-6" />}

      {!loading ? (
        <div className="mt-6 grid min-h-0 flex-1 gap-6 lg:grid-cols-[1fr_minmax(300px,400px)] lg:items-start">
          <div className="flex min-h-[400px] flex-col rounded-2xl border border-mimi-black/12 bg-mimi-black/[0.02] lg:max-h-[calc(100vh-8rem)]">
            <div className="shrink-0 space-y-3 border-b border-mimi-black/10 p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[140px] flex-1">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wide text-mimi-subtle" htmlFor="inv-filter-plat">
                    Plataforma
                  </label>
                  <select
                    id="inv-filter-plat"
                    className="mt-1 w-full rounded-lg border border-mimi-black/12 bg-white px-3 py-2 text-sm"
                    value={listPlatformFilter}
                    onChange={(e) => setListPlatformFilter(e.target.value)}
                  >
                    <option value="">Todas</option>
                    {platforms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[140px] flex-1">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wide text-mimi-subtle" htmlFor="inv-filter-status">
                    Estado
                  </label>
                  <select
                    id="inv-filter-status"
                    className="mt-1 w-full rounded-lg border border-mimi-black/12 bg-white px-3 py-2 text-sm"
                    value={listStatusFilter}
                    onChange={(e) => setListStatusFilter(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {accountStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-mimi-muted">
                Mostrando <strong className="text-mimi-black">{filteredAccounts.length}</strong> de {accounts.length} cuenta(s). Disponibles:{" "}
                <strong>{countsByStatus.AVAILABLE ?? 0}</strong>
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-3">
              <div className="overflow-x-auto rounded-xl border border-mimi-black/10 bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-[1] border-b border-mimi-black/12 bg-mimi-black/[0.06]">
                    <tr>
                      <th className="px-3 py-2.5 font-bold">Plataforma</th>
                      <th className="px-3 py-2.5 font-bold">Correo</th>
                      <th className="px-3 py-2.5 font-bold">Etiqueta</th>
                      <th className="px-3 py-2.5 font-bold">Estado</th>
                      <th className="px-3 py-2.5 font-bold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((a) => {
                      const plat = platforms.find((p) => p.id === a.platformID);
                      return (
                        <tr key={a.id} className="border-b border-mimi-black/10 last:border-0">
                          <td className="px-3 py-2.5 align-top">{plat?.name ?? a.platformID}</td>
                          <td className="px-3 py-2.5 align-top font-mono text-xs">{a.loginEmail}</td>
                          <td className="max-w-[120px] truncate px-3 py-2.5 align-top text-xs text-mimi-muted">
                            {a.internalLabel || "—"}
                          </td>
                          <td className="px-3 py-2.5 align-top">{accountStatusLabel(a.status)}</td>
                          <td className="px-3 py-2.5 text-right align-top">
                            <button
                              type="button"
                              className="mr-2 text-xs font-bold text-mimi-black hover:underline"
                              onClick={() => startEditAccount(a)}
                            >
                              Editar
                            </button>
                            {a.status === "AVAILABLE" && (
                              <button
                                type="button"
                                className="mr-2 text-xs font-bold text-mimi-black hover:underline"
                                onClick={() => void setAccountStatus(a.id, "DISABLED")}
                              >
                                Deshabilitar
                              </button>
                            )}
                            {a.status === "DISABLED" && (
                              <button
                                type="button"
                                className="mr-2 text-xs font-bold text-mimi-black hover:underline"
                                onClick={() => void setAccountStatus(a.id, "AVAILABLE")}
                              >
                                Reactivar
                              </button>
                            )}
                            <button
                              type="button"
                              className="text-xs font-bold text-red-700 hover:underline"
                              onClick={() => void removeAccount(a.id)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredAccounts.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-mimi-muted">No hay cuentas con estos filtros.</p>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-4 lg:self-start">
            <section className="rounded-2xl border border-mimi-black/12 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-mimi-black">
                {editingAccountId ? "Editar cuenta" : "Alta de cuenta"}
              </h2>
              <p className="mt-1 text-xs text-mimi-muted">Los datos sensibles solo se usan en operación; confirma antes de guardar.</p>
              <form className="mt-5 space-y-3" onSubmit={submitAccount}>
                <div>
                  <label className="block text-xs font-bold text-mimi-subtle" htmlFor="inv-plat">
                    Plataforma
                  </label>
                  <select
                    id="inv-plat"
                    className="mt-1 w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
                    value={platformId}
                    onChange={(e) => setPlatformId(e.target.value)}
                  >
                    {platforms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
                  placeholder="Etiqueta interna (opcional)"
                  value={internalLabel}
                  onChange={(e) => setInternalLabel(e.target.value)}
                />
                <input
                  className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
                  placeholder="Correo de la cuenta"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <PasswordRevealInput
                  placeholder="Contraseña"
                  value={password}
                  onChange={setPassword}
                  resetKey={editingAccountId ?? "create"}
                />
                <input
                  className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
                  placeholder="Perfil (opcional)"
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                />
                <input
                  className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
                  placeholder="PIN (opcional)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
                <input
                  className="w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
                  placeholder="Variante de anuncio"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                />
                <div>
                  <label className="block text-xs font-bold text-mimi-subtle" htmlFor="inv-status">
                    {editingAccountId ? "Estado" : "Estado inicial"}
                  </label>
                  <select
                    id="inv-status"
                    className="mt-1 w-full rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {accountStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    className="w-full rounded-full bg-mimi-black py-2.5 text-sm font-bold text-white hover:bg-neutral-800"
                  >
                    {editingAccountId ? "Actualizar cuenta" : "Guardar cuenta"}
                  </button>
                  {editingAccountId ? (
                    <button
                      type="button"
                      className="w-full rounded-full border border-mimi-black/20 py-2.5 text-sm font-bold text-mimi-black hover:bg-mimi-black/[0.04]"
                      onClick={() => resetAccountForm()}
                    >
                      Cancelar edición
                    </button>
                  ) : null}
                </div>
              </form>
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
