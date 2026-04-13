import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/**
 * Modelo de datos MimiPlay: catálogo, inventario de cuentas, pedidos y asignaciones.
 * La lógica de auto-match y cola FIFO se implementará en Lambda en una fase siguiente;
 * aquí queda el esquema y las reglas de acceso.
 */
const schema = a.schema({
  Platform: a
    .model({
      name: a.string().required(),
      slug: a.string().required(),
      description: a.string(),
      category: a.enum(["STREAMING", "SPORTS", "PC_APP", "OTHER"]),
      active: a.boolean(),
      sortOrder: a.integer(),
      /** Anuncios comerciales de esta plataforma (modelo ServicePlan). */
      plans: a.hasMany("ServicePlan", "platformID"),
      accounts: a.hasMany("PlatformAccount", "platformID"),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]),
      allow.authenticated().to(["read"]),
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
    ]),

  /**
   * Anuncio comercial en tienda (streaming, software, evento, etc.).
   * `name` es referencia en listados/admin; en el alta se deriva (titular, variante o plataforma + id).
   */
  ServicePlan: a
    .model({
      platformID: a.id().required(),
      platform: a.belongsTo("Platform", "platformID"),
      name: a.string().required(),
      durationDays: a.integer().required(),
      pricePen: a.float().required(),
      planVariantKey: a.string(),
      /**
       * Presentación en tienda: imagen, titular, datos técnicos, avisos y texto libre.
       * El pedido sigue anclado a name + durationDays + pricePen del registro.
       */
      promoImageUrl: a.string(),
      cardTitle: a.string(),
      accessSummary: a.string(),
      qualitySummary: a.string(),
      devicesSummary: a.string(),
      compatibilitySummary: a.string(),
      stockNotice: a.string(),
      warningNotice: a.string(),
      extraContent: a.string(),
      /**
       * JSON: [{ id, label, durationDays, pricePen }, ...]. Si hay varias, el cliente elige en catálogo y checkout.
       * Vacío = solo usan `durationDays` y `pricePen` del registro.
       */
      purchaseOptionsJson: a.string(),
      /**
       * STANDARD: ficha de catálogo (acceso, calidad, etc.).
       * EVENT: tarjeta con texto largo (varias plataformas/opciones en el cuerpo); el CTA sigue siendo este anuncio.
       */
      cardPresentation: a.enum(["STANDARD", "EVENT"]),
      active: a.boolean(),
      orders: a.hasMany("CustomerOrder", "servicePlanID"),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]),
      allow.authenticated().to(["read"]),
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
    ]),

  PlatformAccount: a
    .model({
      platformID: a.id().required(),
      platform: a.belongsTo("Platform", "platformID"),
      internalLabel: a.string(),
      loginEmail: a.string().required(),
      loginPassword: a.string().required(),
      profileLabel: a.string(),
      pin: a.string(),
      planVariantKey: a.string(),
      status: a.enum([
        "AVAILABLE",
        "RESERVED",
        "ASSIGNED",
        "EXPIRED",
        "DISABLED",
      ]),
      reservedOrderID: a.id(),
      serviceExpiresAt: a.datetime(),
      assignments: a.hasMany("AccountAssignment", "platformAccountID"),
    })
    .authorization((allow) => [
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
    ]),

  CustomerOrder: a
    .model({
      servicePlanID: a.id().required(),
      servicePlan: a.belongsTo("ServicePlan", "servicePlanID"),
      /**
       * Copia al crear el pedido (plataforma + variante del anuncio).
       * Si el `ServicePlan` se elimina después, el admin sigue pudiendo enlazar inventario por estos valores.
       */
      orderedPlatformID: a.id(),
      orderedPlanVariantKey: a.string(),
      status: a.enum([
        "DRAFT",
        "AWAITING_PAYMENT",
        "PAYMENT_SUBMITTED",
        "PAYMENT_CONFIRMED",
        "AWAITING_ACCOUNT",
        "AUTO_MATCH_PROPOSED",
        "AWAITING_ADMIN_CONFIRM",
        "FULFILLED",
        "CANCELLED",
        "MANUAL_ASSIGNMENT_NEEDED",
      ]),
      paymentConfirmedAt: a.datetime(),
      paymentMethod: a.string(),
      paymentProofStorageKey: a.string(),
      payerFullName: a.string(),
      payerSecurityCode: a.string(),
      /** Opción elegida al comprar (si el anuncio tenía varias). */
      chosenPricePen: a.float(),
      chosenDurationDays: a.integer(),
      chosenOptionLabel: a.string(),
      activationStartsAt: a.datetime(),
      fulfilledAt: a.datetime(),
      credentialEmail: a.string(),
      credentialPassword: a.string(),
      credentialProfile: a.string(),
      credentialPin: a.string(),
      credentialRenewsAt: a.datetime(),
      notes: a.string(),
      assignments: a.hasMany("AccountAssignment", "orderID"),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
    ]),

  AccountAssignment: a
    .model({
      orderID: a.id().required(),
      order: a.belongsTo("CustomerOrder", "orderID"),
      platformAccountID: a.id().required(),
      platformAccount: a.belongsTo("PlatformAccount", "platformAccountID"),
      source: a.enum(["AUTO", "MANUAL"]),
      status: a.enum([
        "PROPOSED",
        "ADMIN_CONFIRMED",
        "SUPERSEDED",
        "CANCELLED",
      ]),
      proposedAt: a.datetime(),
      confirmedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
    ]),

  /**
   * Avisos in-app por usuario (Cognito `sub` en `recipientSub`).
   * El cliente solo lee/actualiza sus filas; el staff crea registros dirigidos a un `recipientSub` concreto.
   */
  UserNotification: a
    .model({
      /** Debe coincidir con el claim `sub` del JWT del destinatario. */
      recipientSub: a.string().required(),
      kind: a.enum(["ORDER_CREDENTIALS_UPDATED"]),
      title: a.string().required(),
      body: a.string().required(),
      readAt: a.datetime(),
      /** JSON tipado en front (`NotificationActionPayload`); extensible por `kind`. */
      actionPayloadJson: a.string(),
    })
    .secondaryIndexes((index) => [index("recipientSub").queryField("listNotificationByRecipientSub")])
    .authorization((allow) => [
      allow.ownerDefinedIn("recipientSub").identityClaim("sub").to(["read", "update"]),
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
