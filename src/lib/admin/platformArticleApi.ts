async function parseJson(res: Response): Promise<Record<string, unknown>> {
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

export async function adminApiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const json = await parseJson(res);
  if (!res.ok) throw new Error(String(json.error ?? "Request failed"));
  return json as T;
}

export async function adminApiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await parseJson(res);
  if (!res.ok) throw new Error(String(json.error ?? "Request failed"));
  return json as T;
}

export async function adminApiPatch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await parseJson(res);
  if (!res.ok) throw new Error(String(json.error ?? "Request failed"));
  return json as T;
}

export async function adminApiDelete(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE" });
  const json = await parseJson(res);
  if (!res.ok) throw new Error(String(json.error ?? "Request failed"));
}
