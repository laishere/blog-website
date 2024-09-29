import { updateCookies } from "./cookies";
import { configBaseUrl } from "./urls";

let _request: Request | null = null;

export function setRequestContext(request: Request) {
  _request = request;
  configBaseUrl(request.url);
  updateCookies(request.headers.get("Cookie"));
}

export function getRequestContext() {
  return _request;
}
