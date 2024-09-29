type Cookies = Record<string, string>;

let _cookies: Cookies = {};

export function updateCookies(cookieHeader: string | null): Cookies {
  const cookies: Cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, value] = cookie.split("=");
    cookies[name.trim()] = value.trim();
  });
  return (_cookies = cookies);
}

export function getCookies(): Cookies {
  return _cookies;
}

export function setCookies(c: Cookies) {
  _cookies = c;
}

export function getCookie(key: string): string | undefined {
  return _cookies[key];
}

export function clientSetCookie(key: string, value: string) {
  document.cookie = `${key}=${value}; path=/; SameSite=Lax`;
  _cookies[key] = value;
}
