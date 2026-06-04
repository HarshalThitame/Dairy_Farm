export const FARM_TOKEN_COOKIE = "goshala_token";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function isSecureCookieRuntime() {
  return process.env.NODE_ENV === "production";
}

export function setFarmAuthCookie(response, token) {
  response.cookies.set(FARM_TOKEN_COOKIE, token, {
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
    secure: isSecureCookieRuntime(),
    httpOnly: false
  });

  return response;
}

export function clearFarmAuthCookie(response) {
  response.cookies.set(FARM_TOKEN_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: isSecureCookieRuntime(),
    httpOnly: false
  });

  return response;
}
