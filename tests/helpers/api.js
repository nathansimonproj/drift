// Thin JSON-over-fetch helper shared by the integration tests. Kept minimal
// deliberately — this project has no HTTP client dependency, and Node's
// built-in fetch is enough for exercising the real API surface.
function api(baseUrl) {
  async function request(path, { method = 'GET', body, token, cookie } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    if (cookie) headers.Cookie = cookie;

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });
    const setCookie = res.headers.get('set-cookie');
    let json = null;
    const text = await res.text();
    if (text) {
      try { json = JSON.parse(text); } catch { /* non-JSON response (e.g. a redirect) */ }
    }
    return { status: res.status, json, setCookie };
  }

  return {
    get: (path, opts) => request(path, { ...opts, method: 'GET' }),
    post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
    put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
    del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  };
}

module.exports = { api };
