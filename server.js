const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 10000;
const root = path.join(__dirname, "public");
const MAX_VOICE_BYTES = 8 * 1024 * 1024;
const ASSET_BUILD = "2026-08-16-final1";
let lastGeocodeAt = 0;
const geocodeCache = new Map();

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function readRequestBody(req, limit = MAX_VOICE_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let settled = false;
    const fail = err => { if (settled) return; settled = true; reject(err); };
    req.on("data", chunk => {
      total += chunk.length;
      if (total > limit) {
        fail(Object.assign(new Error("Voice recording is too large."), { code: "LIMIT" }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => { if (!settled) { settled = true; resolve(Buffer.concat(chunks)); } });
    req.on("error", fail);
    req.on("aborted", () => fail(new Error("Request was aborted.")));
  });
}

function buildSarvamMultipart(audio, contentType) {
  const boundary = `----CivicFixVoice${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  const safeType = String(contentType || "audio/webm").split(";")[0].trim() || "audio/webm";
  let extension = "webm";
  if (safeType.includes("mp4")) extension = "m4a";
  else if (safeType.includes("ogg")) extension = "ogg";
  else if (safeType.includes("wav")) extension = "wav";
  else if (safeType.includes("mpeg")) extension = "mp3";

  const head = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="civicfix-voice.${extension}"\r\n` +
    `Content-Type: ${safeType}\r\n\r\n`, "utf8"
  );
  const middle = Buffer.from(
    `\r\n--${boundary}\r\n` +
    `Content-Disposition: form-data; name="model"\r\n\r\n` +
    `saaras:v3\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="mode"\r\n\r\n` +
    `transcribe\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="language_code"\r\n\r\n` +
    `unknown\r\n` +
    `--${boundary}--\r\n`, "utf8"
  );
  return { body: Buffer.concat([head, audio, middle]), contentType: `multipart/form-data; boundary=${boundary}` };
}

async function transcribeVoice(req, res) {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) return sendJson(res, 503, { error: "Voice reporting is not configured on the server yet." });
  const declaredLength = Number(req.headers["content-length"] || 0);
  if (declaredLength > MAX_VOICE_BYTES) return sendJson(res, 413, { error: "Voice recording is too large. Please keep it short and try again." });

  let audio;
  try { audio = await readRequestBody(req); }
  catch (err) {
    if (err.code === "LIMIT") return sendJson(res, 413, { error: "Voice recording is too large. Please keep it short and try again." });
    return sendJson(res, 400, { error: "Could not read the voice recording." });
  }
  if (!audio.length) return sendJson(res, 400, { error: "The recording was empty. Please try again." });

  const multipart = buildSarvamMultipart(audio, req.headers["content-type"]);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28000);
  try {
    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
        "Content-Type": multipart.contentType,
        "Content-Length": String(multipart.body.length)
      },
      body: multipart.body,
      signal: controller.signal
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }
    if (!response.ok) {
      console.error("Sarvam STT error", response.status, data);
      if (response.status === 403) return sendJson(res, 502, { error: "Voice service authentication failed. Please check the server API key." });
      if (response.status === 429) return sendJson(res, 429, { error: "Voice service is temporarily rate-limited. Please try again in a moment." });
      return sendJson(res, 502, { error: data?.message || data?.error || "Voice transcription failed. Please try again." });
    }
    return sendJson(res, 200, {
      transcript: data?.transcript || "",
      language_code: data?.language_code || null,
      language_probability: data?.language_probability ?? null,
      request_id: data?.request_id || null
    });
  } catch (err) {
    console.error("Voice transcription request failed", err);
    if (err?.name === "AbortError") return sendJson(res, 504, { error: "Voice transcription took too long. Please try a shorter recording." });
    return sendJson(res, 502, { error: "Voice service is temporarily unavailable. Please try again." });
  } finally { clearTimeout(timeout); }
}

async function geocodeAddress(req, res) {
  const raw = new URL(req.url, `http://${req.headers.host || "localhost"}`).searchParams.get("q") || "";
  const query = raw.trim().replace(/\s+/g, " ");
  if (query.length < 3) return sendJson(res, 400, { error: "Please enter a little more location detail." });
  if (query.length > 240) return sendJson(res, 400, { error: "Location text is too long." });

  const key = query.toLowerCase();
  const cached = geocodeCache.get(key);
  if (cached && Date.now() - cached.at < 24 * 60 * 60 * 1000) return sendJson(res, 200, cached.data);

  const wait = Date.now() - lastGeocodeAt;
  if (wait < 1000) return sendJson(res, 429, { error: "Address lookup is briefly rate-limited. Please try again in a second." });
  lastGeocodeAt = Date.now();

  const endpoint = `https://geocode.xyz/?locate=${encodeURIComponent(query)}&region=IN&json=1`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(endpoint, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "CivicFix-Jharkhand/1.0 civic-reporting-demo"
      },
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return sendJson(res, 502, { error: "The address service is temporarily unavailable." });
    if (data?.error || !data?.latt || !data?.longt) {
      return sendJson(res, 404, { error: data?.error?.description || "That address could not be located. Try adding the city or district." });
    }
    const result = {
      latitude: Number(data.latt),
      longitude: Number(data.longt),
      display_name: data.altgeocode || data.staddress || [data.city, data.prov, data.countryname].filter(Boolean).join(", ") || query
    };
    if (!Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) return sendJson(res, 404, { error: "That address could not be located." });
    geocodeCache.set(key, { at: Date.now(), data: result });
    return sendJson(res, 200, result);
  } catch (err) {
    if (err?.name === "AbortError") return sendJson(res, 504, { error: "Address lookup timed out. Please try again." });
    console.error("Geocoding request failed", err);
    return sendJson(res, 502, { error: "Address lookup is temporarily unavailable." });
  } finally { clearTimeout(timeout); }
}

function serveFile(res, file, p) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
  let body = fs.readFileSync(file);
  const ext = path.extname(file);

  if (p === "/index.html" && ext === ".html") {
    const html = body.toString("utf8");
    body = Buffer.from(html.replace("</body>", `<script src="/final-polish.js?v=${ASSET_BUILD}"></script><script src="/voice.js?v=${ASSET_BUILD}"></script></body>`), "utf8");
  }

  const cache = p === "/index.html" || p === "/voice.js" || p === "/final-polish.js" ? "no-store" : "public,max-age=3600";
  res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream", "Cache-Control": cache });
  res.end(body);
  return true;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const p = url.pathname;
  if (p === "/health" || p === "/api/health") return sendJson(res, 200, { ok: true, service: "CivicFix" });
  if (p === "/api/voice-transcribe") {
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return sendJson(res, 405, { error: "Method not allowed." }); }
    return transcribeVoice(req, res);
  }
  if (p === "/api/geocode") {
    if (req.method !== "GET") { res.setHeader("Allow", "GET"); return sendJson(res, 405, { error: "Method not allowed." }); }
    return geocodeAddress(req, res);
  }
  if (req.method !== "GET" && req.method !== "HEAD") return sendJson(res, 405, { error: "Method not allowed." });
  const normalized = p === "/" ? "/index.html" : p;
  const file = path.join(root, normalized);
  if (serveFile(res, file, normalized)) return;
  const spa = path.join(root, "index.html");
  if (serveFile(res, spa, "/index.html")) return;
  sendJson(res, 404, { error: "Not found" });
}).listen(PORT, "0.0.0.0", () => console.log(`CivicFix listening on ${PORT}`));
