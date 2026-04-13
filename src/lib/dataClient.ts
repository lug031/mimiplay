import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

export const dataClient = generateClient<Schema>();

/** Panel admin: fuerza `userPool` para que AppSync reciba el JWT con `cognito:groups`. */
export const adminDataClient = generateClient<Schema>({ authMode: "userPool" });

export type AdminDataClient = typeof adminDataClient;
