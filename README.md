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
- `/app/*` — Portal cliente (Authenticator).
- `/admin/*` — Panel admin (Authenticator + pertenencia al grupo Cognito `admin`).

## Admin en Cognito

Tras crear el primer usuario, asígnalo al grupo `admin` desde la consola de Cognito o con la CLI, para acceder a `/admin`.

## Despliegue CI

`amplify.yml` usa **`npm install --legacy-peer-deps`** (en backend y frontend) en lugar de `npm ci`, para evitar fallos con el árbol de dependencias de `@aws-amplify/backend` y lockfiles incompletos en CodeBuild. El `package-lock.json` debe estar versionado y al día.

En `package.json`, **`overrides`** fija versiones de `fast-xml-parser` y `strnum` que suelen chocar entre CDK y AWS SDK. Las dependencias explícitas **`xstate`** y **`@aws-amplify/core`** ayudan a que Vite 8 resuelva bien `@aws-amplify/ui-react`.
