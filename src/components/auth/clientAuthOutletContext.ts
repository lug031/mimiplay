/** Contexto del layout `/app/acceso/*`: el hijo de login actualiza título y pie según su fase interna. */
export type ClientAuthOutletContext = {
  setLoginHeadline: (v: { title: string; showFooterLink: boolean }) => void;
};
