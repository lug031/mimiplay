import { Amplify } from "aws-amplify";
import type { ResourcesConfig } from "aws-amplify";
import outputs from "../amplify_outputs.json";

/** Sustituye este archivo con la salida de `npm run sandbox` (Amplify Gen 2). */
export function configureAmplify() {
  Amplify.configure(outputs as ResourcesConfig);
}
