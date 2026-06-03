export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

export function isUuid(value) {
  return UUID_PATTERN.test(String(value || ""));
}

export function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export async function readJsonBody(request, message = "Request body JSON format मध्ये नाही.") {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    throw badRequest(message);
  }
}
