import { snackbarVariantForMessage, useAdminSnackbar } from "@/components/admin/AdminSnackbar";
import { MimiLoadingState } from "@/components/ui/MimiLoadingState";
import { type FormEvent, useEffect, useState } from "react";
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

  async function createAccount(e: FormEvent) {
    e.preventDefault();
    if (!platformId || !email.trim() || !password.trim()) {
      showSnackbar("Plataforma, correo y contraseña son obligatorios.", "warning");
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
    setInternalLabel("");
    setEmail("");
    setPassword("");
    setProfile("");
    setPin("");
    setVariant("");
    setStatus("AVAILABLE");
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
    <div>
      <h1 className="text-2xl font-extrabold text-mimi-black">Inventario de cuentas</h1>
      <p className="mt-2 text-sm text-mimi-subtle">
        Reposición y control de stock de accesos por plataforma para cumplir pedidos pagados y vigentes.
      </p>

      {loading && <MimiLoadingState tone="light" layout="inline" className="mt-4" />}

      <section className="mt-10 rounded-2xl border border-mimi-black/12 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold">Alta de cuenta</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={createAccount}>
          <select
            className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
            value={platformId}
            onChange={(e) => setPlatformId(e.target.value)}
          >
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
            placeholder="Etiqueta interna (opcional)"
            value={internalLabel}
            onChange={(e) => setInternalLabel(e.target.value)}
          />
          <input
            className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
            placeholder="Correo de la cuenta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
            placeholder="Perfil (opcional)"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
          />
          <input
            className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
            placeholder="PIN (opcional)"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <input
            className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
            placeholder="Variante de anuncio"
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
          />
          <select
            className="rounded-lg border border-mimi-black/12 px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {accountStatusLabel(s)}
              </option>
            ))}
          </select>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full rounded-full bg-mimi-black py-2.5 text-sm font-bold text-white hover:bg-neutral-800 sm:w-auto sm:px-8"
            >
              Guardar cuenta
            </button>
          </div>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-extrabold">Listado</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-mimi-black/12 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-mimi-black/12 bg-mimi-black/[0.06]">
              <tr>
                <th className="px-3 py-2 font-bold">Plataforma</th>
                <th className="px-3 py-2 font-bold">Correo</th>
                <th className="px-3 py-2 font-bold">Estado</th>
                <th className="px-3 py-2 font-bold" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => {
                const plat = platforms.find((p) => p.id === a.platformID);
                return (
                  <tr key={a.id} className="border-b border-mimi-black/12 last:border-0">
                    <td className="px-3 py-2">{plat?.name ?? a.platformID}</td>
                    <td className="px-3 py-2 font-mono text-xs">{a.loginEmail}</td>
                    <td className="px-3 py-2">{accountStatusLabel(a.status)}</td>
                    <td className="px-3 py-2 text-right">
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
        </div>
      </section>
    </div>
  );
}
