import { type FormEvent, useEffect, useState } from "react";
import { dataClient } from "@/lib/dataClient";
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
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

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
    setError(null);
    try {
      const [pr, ar] = await Promise.all([
        dataClient.models.Platform.list(),
        dataClient.models.PlatformAccount.list(),
      ]);
      const plats = (pr.data ?? []).filter((x) => x.id).map((x) => ({ id: x.id!, name: x.name }));
      setPlatforms(plats);
      setAccounts((ar.data ?? []).filter((x) => x.id).map((x) => x as Account));
      setPlatformId((prev) => prev || plats[0]?.id || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createAccount(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!platformId || !email.trim() || !password.trim()) {
      setMsg("Plataforma, correo y contraseña son obligatorios.");
      return;
    }
    const { errors } = await dataClient.models.PlatformAccount.create({
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
      setMsg(errors.map((x) => x.message).join("; "));
      return;
    }
    setInternalLabel("");
    setEmail("");
    setPassword("");
    setProfile("");
    setPin("");
    setVariant("");
    setStatus("AVAILABLE");
    setMsg("Cuenta creada.");
    await load();
  }

  async function setAccountStatus(id: string, next: (typeof STATUSES)[number]) {
    await dataClient.models.PlatformAccount.update({ id, status: next });
    await load();
  }

  async function removeAccount(id: string) {
    if (!window.confirm("¿Eliminar esta cuenta del inventario?")) return;
    await dataClient.models.PlatformAccount.delete({ id });
    await load();
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-tcr-dark">Inventario de cuentas</h1>
      <p className="mt-2 text-sm text-tcr-text-muted">
        Cuentas disponibles para asignar a pedidos (solo administradores).
      </p>

      {loading && <p className="mt-4 text-tcr-text-muted">Cargando…</p>}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      )}
      {msg && <div className="mt-4 rounded-lg border border-tcr-border bg-white px-3 py-2 text-sm">{msg}</div>}

      <section className="mt-10 rounded-2xl border border-tcr-border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold">Alta de cuenta</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={createAccount}>
          <select
            className="rounded-lg border border-tcr-border px-3 py-2 text-sm"
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
            className="rounded-lg border border-tcr-border px-3 py-2 text-sm"
            placeholder="Etiqueta interna (opcional)"
            value={internalLabel}
            onChange={(e) => setInternalLabel(e.target.value)}
          />
          <input
            className="rounded-lg border border-tcr-border px-3 py-2 text-sm"
            placeholder="Correo de la cuenta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="rounded-lg border border-tcr-border px-3 py-2 text-sm"
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="rounded-lg border border-tcr-border px-3 py-2 text-sm"
            placeholder="Perfil (opcional)"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
          />
          <input
            className="rounded-lg border border-tcr-border px-3 py-2 text-sm"
            placeholder="PIN (opcional)"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <input
            className="rounded-lg border border-tcr-border px-3 py-2 text-sm"
            placeholder="Variante de plan (opcional)"
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
          />
          <select
            className="rounded-lg border border-tcr-border px-3 py-2 text-sm"
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
              className="w-full rounded-full bg-tcr-teal py-2.5 text-sm font-bold text-white hover:bg-[#007a8f] sm:w-auto sm:px-8"
            >
              Guardar cuenta
            </button>
          </div>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-extrabold">Listado</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-tcr-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-tcr-border bg-tcr-bg">
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
                  <tr key={a.id} className="border-b border-tcr-border last:border-0">
                    <td className="px-3 py-2">{plat?.name ?? a.platformID}</td>
                    <td className="px-3 py-2 font-mono text-xs">{a.loginEmail}</td>
                    <td className="px-3 py-2">{accountStatusLabel(a.status)}</td>
                    <td className="px-3 py-2 text-right">
                      {a.status === "AVAILABLE" && (
                        <button
                          type="button"
                          className="mr-2 text-xs font-bold text-tcr-teal hover:underline"
                          onClick={() => void setAccountStatus(a.id, "DISABLED")}
                        >
                          Deshabilitar
                        </button>
                      )}
                      {a.status === "DISABLED" && (
                        <button
                          type="button"
                          className="mr-2 text-xs font-bold text-tcr-teal hover:underline"
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
