// Vendored from the monorepo package `@workspace/api-client-react`.
// Regenerate `generated/` with Orval from the API OpenAPI spec; `custom-fetch.ts`
// is hand-written and safe to edit here.
export * from "./generated/api";
export * from "./generated/api.schemas";
export { customFetch, setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter, CustomFetchOptions, ErrorType, BodyType } from "./custom-fetch";
export { ApiError, ResponseParseError } from "./custom-fetch";
