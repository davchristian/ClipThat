export class RequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, method = "GET", payload?: unknown): Promise<T> {
  const multipart = payload instanceof FormData;
  const response = await fetch(`/api/v1/${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers:
      payload !== undefined && !multipart ? { "Content-Type": "application/json" } : undefined,
    body: payload === undefined ? undefined : multipart ? payload : JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok)
    throw new RequestError(result.error?.message || "Permintaan gagal.", response.status);
  return result.data as T;
}
