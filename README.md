# MimiPlay

Portal en **React + TypeScript + Vite + Tailwind** con backend **AWS Amplify Gen 2** (Cognito, AppSync, S3). Diseño alineado a la demo **Crediflash** (paleta `tcr-*`, Manrope).

## Requisitos

- Node.js 20.x (recomendado)
- Cuenta AWS y Amplify Hosting (opcional) para despliegue

## Primer uso

```bash
cd mimiplay
npm install --legacy-peer-deps
cp amplify_outputs.example.json amplify_outputs.json
npm run sandbox
```

El comando `sandbox` despliega Auth, Data y Storage en la nube y **sobrescribe** `amplify_outputs.json`. Sin ese archivo válido, el login y las llamadas a API fallarán.

En otra terminal:

```bash
npm run dev
```

## Estructura del backend (`amplify/`)

- **`auth/resource.ts`**: inicio de sesión por email y grupo `admin`.
- **`data/resource.ts`**: modelos `Platform`, `ServicePlan`, `PlatformAccount`, `CustomerOrder`, `AccountAssignment` (inventario, pedidos y trazabilidad de asignaciones).
- **`storage/resource.ts`**: prefijos `payment-proofs/*` y `support-attachments/*` para usuarios autenticados y administradores.

## Rutas de la app

- `/` — Landing pública.
- `/catalogo` — Catálogo de planes (lectura con **API Key**, sin login).
- `/app/*` — Portal cliente (Authenticator): nuevo pedido con comprobante, mis pedidos y detalle (el catálogo comercial es `/catalogo`).
- `/admin/*` — Panel admin (Authenticator + grupo **admin**): catálogo, pedidos, inventario. (`/admin/cola` redirige a `/admin/pedidos`.)

### Flujo operativo (fases 1–3)

1. **Admin** crea **plataformas** y **planes** en `/admin/catalogo` y cuentas en `/admin/inventario`.
2. **Cliente** (registrado) elige plan en `/catalogo`, completa datos de pago y sube comprobante → pedido en estado `PAYMENT_SUBMITTED`.
3. **Admin** en `/admin/pedidos` abre el pedido, ve el comprobante, **confirma pago** → `PAYMENT_CONFIRMED`.
4. **Admin** entrega: puede elegir una cuenta **AVAILABLE** del inventario (misma plataforma) o escribir credenciales a mano; indica fecha/hora de renovación → `FULFILLED` y el cliente las ve en `/app/pedidos/:id`.

## Admin en Cognito

Tras crear el primer usuario, asígnalo al grupo `admin` desde la consola de Cognito o con la CLI, para acceder a `/admin`.

## Despliegue CI

`amplify.yml` usa **`npm install --legacy-peer-deps`** (en backend y frontend) en lugar de `npm ci`, para evitar fallos con el árbol de dependencias de `@aws-amplify/backend` y lockfiles incompletos en CodeBuild. El `package-lock.json` debe estar versionado y al día.

En `package.json`, **`overrides`** fija versiones de `fast-xml-parser` y `strnum` que suelen chocar entre CDK y AWS SDK. Las dependencias explícitas **`xstate`** y **`@aws-amplify/core`** ayudan a que Vite 8 resuelva bien `@aws-amplify/ui-react`.

### Error `spawnSync docker ENOENT` en el backend

El entorno de build de Amplify **no incluye Docker**. Si el CDK no encuentra **esbuild** en la raíz del proyecto, intenta empaquetar con Docker y falla. Por eso el proyecto declara **`esbuild`** en `devDependencies` y `amplify.yml` exporta `PATH` con `node_modules/.bin` antes de `ampx pipeline-deploy`.

Si tras esto sigue fallando, en la consola de Amplify revisa que la app tenga el **rol de servicio** con `AmplifyBackendDeployFullAccess` (despliegue Gen 2).
