async function req(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 204) return {};
  let data;
  try { data = await res.json(); }
  catch {
    if (res.ok) throw new Error('Unexpected response from server.');
    data = {};
  }
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}
export const api = {
  get: (p) => req(p),
  post: (p, body) => req(p, { method: 'POST', body }),
};
