/* Shared with the worker's Node tests; no API response is eligible for this cache. */
self.RihlaOffline = {
  mediaCache: "rihla-offline-media-v1",
  shellPrefix: "rihla-shell-",

  isPublicNavigation(url, origin) {
    if (url.origin !== origin) return false;
    return url.pathname === "/" || /^\/(?:quran\/\d+(?:\/\d+)?|content\/[^/]+|creator\/[^/]+|series\/[^/]+|collection\/[^/]+)\/?$/.test(url.pathname);
  },

  parseRange(value, size) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(value ?? "");
    if (!match || (!match[1] && !match[2]) || size <= 0) return null;
    const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start || (!match[1] && Number(match[2]) === 0)) return null;
    return { start, end };
  },

  async mediaResponse(response, range) {
    if (!range) return response;
    const blob = await response.blob();
    const bytes = this.parseRange(range, blob.size);
    const headers = new Headers(response.headers);
    headers.delete("content-encoding");
    headers.set("accept-ranges", "bytes");
    if (!bytes) {
      headers.set("content-range", `bytes */${blob.size}`);
      headers.set("content-length", "0");
      return new Response(null, { status: 416, headers });
    }
    headers.set("content-range", `bytes ${bytes.start}-${bytes.end}/${blob.size}`);
    headers.set("content-length", String(bytes.end - bytes.start + 1));
    return new Response(blob.slice(bytes.start, bytes.end + 1, headers.get("content-type") ?? ""), { status: 206, headers });
  },
};
