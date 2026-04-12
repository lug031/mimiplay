type GraphQLErrorLike = { message?: string | null; errorType?: string | null };

export function formatModelErrors(errors?: GraphQLErrorLike[] | null): string {
  if (!errors?.length) return "";
  return errors
    .map((e) => [e.errorType, e.message].filter(Boolean).join(": "))
    .join("; ");
}
