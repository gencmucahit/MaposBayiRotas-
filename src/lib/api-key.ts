/**
 * Dış sistemlerin (ör. adisyon kurulum aracı) uygulamaya API üzerinden
 * işletme kaydı yapabilmesi için basit bir API anahtarı kontrolü.
 *
 * İstek şu şekillerden biriyle kimliklendirilebilir:
 *   x-api-key: <ANAHTAR>
 *   Authorization: Bearer <ANAHTAR>
 */
export function getRequestApiKey(request: Request): string | null {
  const headerKey = request.headers.get("x-api-key");
  if (headerKey) return headerKey;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
}

export function isValidApiKey(request: Request): boolean {
  const expected = process.env.API_KEY;
  // API_KEY tanımlı değilse, yanlışlıkla açık bırakmamak için isteği reddet.
  if (!expected) return false;

  const provided = getRequestApiKey(request);
  if (!provided) return false;

  return provided === expected;
}
