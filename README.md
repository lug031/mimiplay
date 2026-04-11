# MimiPlay

Portal en **React + TypeScript + Vite + Tailwind** con backend **AWS Amplify Gen 2** (Cognito, AppSync, S3). Diseño alineado a la demo **Crediflash** (paleta `tcr-*`, Manrope).

## Requisitos

- Node.js 20.x (recomendado)
- Cuenta AWS y Amplify Hosting (opcional) para despliegue

## Primer uso

```bash
cd mimiplay
npm install
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
- `/app/*` — Portal cliente (Authenticator).
- `/admin/*` — Panel admin (Authenticator + pertenencia al grupo Cognito `admin`).

## Admin en Cognito

Tras crear el primer usuario, asígnalo al grupo `admin` desde la consola de Cognito o con la CLI, para acceder a `/admin`.

## Despliegue CI

`amplify.yml` ejecuta `ampx pipeline-deploy` en la fase backend y `npm run build` en el frontend (artefacto `dist/`).
