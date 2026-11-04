import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "data", "db.json");
const app = express();
const sessions = new Map();
const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const extByType = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };
    const ext = extByType[file.mimetype] || ".img";
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Upload a JPG, PNG, WEBP, or GIF image"));
  },
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadDir));

const BACKEND_URL = () => process.env.PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:5013";
// Keep only string URLs/paths for post images.
function cleanImageList(images) {
  return Array.isArray(images) ? images.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()).slice(0, 20) : [];
}

function readDb() {
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  let changed = false;
  for (const user of db.users) {
    if (user.role === "reporter" && user.accountType === "public-contributor" && user.reporterId) {
      delete user.reporterId;
      changed = true;
    } else if (user.role === "reporter" && user.accountType !== "public-contributor" && !user.reporterId) {
      user.reporterId = nextReporterId(db);
      changed = true;
    }
  }
  if (changed) writeDb(db);
  return db;
}
function writeDb(db) { fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)); }
function cleanUser(user) { const { passwordHash, ...safe } = user; return safe; }
function hashPassword(password) { const salt = crypto.randomBytes(16).toString("hex"); return `scrypt:${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`; }
function verifyPassword(password, stored) { const [, salt, hash] = String(stored || "").split(":"); if (!salt || !hash) return false; const actual = crypto.scryptSync(password, salt, 64).toString("hex"); return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(hash, "hex")); }
function hasFullAccess(user) { return user.role === "full-admin" || user.fullAccess === true || user.accessLevel === "full-access"; }
function canViewEverything(user) { return hasFullAccess(user) || user.role === "read-only-admin" || user.accessLevel === "view-only"; }
function isViewOnly(user) { return user.accessLevel === "view-only"; }

function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? sessions.get(token) : null;
  if (!user) return res.status(401).json({ message: "Please login first" });
  const dbUser = readDb().users.find((item) => item.id === user.id);
  if (!dbUser) { sessions.delete(token); return res.status(401).json({ message: "Your account no longer exists. Please contact the administrator." }); }
  if (dbUser.status === "inactive") { sessions.delete(token); return res.status(403).json({ message: "Your account is inactive. Please contact the administrator." }); }
  if (dbUser.blocked) { sessions.delete(token); return res.status(403).json({ message: dbUser.blockMessage || "Your account has been blocked by the administrator." }); }
  if (isViewOnly(dbUser) && !["GET", "HEAD", "OPTIONS"].includes(req.method)) return res.status(403).json({ message: "This account has view-only access" });
  req.user = cleanUser(dbUser);
  sessions.set(token, req.user);
  next();
}
function allow(...roles) {
  return (req, res, next) => (roles.includes(req.user.role) || (roles.includes("full-admin") && hasFullAccess(req.user)))
    ? next()
    : res.status(403).json({ message: "You do not have permission for this action" });
}
function superAdminOnly(req, res, next) {
  return req.user.role === "full-admin"
    ? next()
    : res.status(403).json({ message: "Only a Super Admin can change news posts" });
}
// A post belongs to a dashboard reporter if they wrote it OR it was assigned to them (same id / same name) from the public form.
function isMine(post, user) {
  if (post.authorId === user.id) return true;
  if (post.assignedReporterId && post.assignedReporterId === user.id) return true;
  return Boolean(post.assignedReporterName) && post.assignedReporterName.trim().toLowerCase() === String(user.name || "").trim().toLowerCase();
}
function makeId(prefix) { return `${prefix}_${crypto.randomBytes(5).toString("hex")}`; }
function nextReporterId(db) {
  const lastId = db.users.reduce((max, user) => {
    const match = user.role === "reporter" ? /^IVR-(\d+)$/.exec(user.reporterId || "") : null;
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `IVR-${String(lastId + 1).padStart(4, "0")}`;
}

function slugify(value, fallback) {
  const slug = String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return slug || fallback;
}

function publicPost(post) {
  const category = post.categories?.[0] || "देश";
  const absolute = (src) => (src && src.startsWith("/uploads/") ? `${BACKEND_URL()}${src}` : src);
  const images = cleanImageList(post.images).map(absolute);
  return {
    ...post,
    excerpt: post.excerpt ?? post.summary ?? "",
    category,
    image: post.image ? absolute(post.image) : `https://picsum.photos/seed/${encodeURIComponent(post.id)}/1200/700`,
    images,
    date: post.date || new Date(post.publishedAt || post.updatedAt || post.createdAt).toLocaleDateString("hi-IN", { day: "2-digit", month: "long", year: "numeric" }),
    href: `/article/${encodeURIComponent(post.slug || post.id)}`,
    slug: post.slug || post.id,
  };
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Public API used by the Next.js news website. Only published/public posts are returned.
app.get("/api/public/posts", (req, res) => {
  const db = readDb();
  let posts = db.posts
    .filter((post) => post.status === "published" && post.visibility !== "private")
    .sort((a, b) => new Date(b.publishedAt || b.updatedAt).getTime() - new Date(a.publishedAt || a.updatedAt).getTime())
    .map(publicPost);

  const search = String(req.query.search || "").trim().toLowerCase();
  const category = String(req.query.category || "").trim();
  if (search) {
    posts = posts.filter((post) => `${post.title} ${post.excerpt} ${post.category} ${(post.tags || []).join(" ")}`.toLowerCase().includes(search));
  }
  if (category) posts = posts.filter((post) => post.category === category || post.categories?.includes(category));

  res.json({ posts });
});

// Public location dropdowns use ECI's open master-data endpoints. Responses are cached
// for six hours so the public form does not repeatedly call ECI for the same data.
const eciCache = new Map();
const ECI_API_BASE = "https://gateway-voters.eci.gov.in/api/v1";
function eciRows(payload, depth = 0) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object" || depth > 4) return [];
  const listKeys = ["payload", "data", "states", "stateList", "districts", "districtList", "acs", "acList",
    "constituencies", "assemblyConstituencies", "constituencyList", "records", "result", "items", "list", "content", "response"];
  for (const key of listKeys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = eciRows(value, depth + 1);
      if (nested.length) return nested;
    }
  }
  // any array of objects anywhere in the first level
  for (const value of Object.values(payload)) {
    if (Array.isArray(value) && value.length && typeof value[0] === "object") return value;
  }
  for (const value of Object.values(payload)) {
    if (value && typeof value === "object") {
      const nested = eciRows(value, depth + 1);
      if (nested.length) return nested;
    }
  }
  return [];
}
async function fetchEciList(pathname) {
  const cached = eciCache.get(pathname);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  const response = await fetch(`${ECI_API_BASE}${pathname}`, {
    headers: {
      Accept: "application/json, text/plain, */*",
      Origin: "https://voters.eci.gov.in",
      Referer: "https://voters.eci.gov.in/",
      "User-Agent": "Mozilla/5.0 IndiaVoice/1.0",
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`ECI location service returned ${response.status}`);
  const payload = await response.json();
  const rows = eciRows(payload);
  console.log("ECI", pathname, "rows:", rows.length, "sample:", JSON.stringify(rows[0]));
  if (!rows.length) throw new Error("ECI location service returned an unexpected response");
  eciCache.set(pathname, { data: rows, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
  return rows;
}
function firstValue(item, keys) {
  const toText = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      for (const key of ["en", "english", "name", "label", "value", "ENG", "eng"]) {
        if (value[key] !== undefined && value[key] !== null && String(value[key]).trim()) return String(value[key]).trim();
      }
      return "";
    }
    return String(value).trim();
  };
  for (const key of keys) {
    const value = toText(item?.[key]);
    if (value) return value;
  }
  if (item && typeof item === "object") {
    const wanted = new Set(keys.map((key) => key.toLowerCase().replace(/[^a-z0-9]/g, "")));
    for (const [key, rawValue] of Object.entries(item)) {
      if (!wanted.has(key.toLowerCase().replace(/[^a-z0-9]/g, ""))) continue;
      const value = toText(rawValue);
      if (value) return value;
    }
  }
  return "";
}
function detectCodeName(item, kind) {
  const entries = Object.entries(item || {}).filter(([, v]) => v !== null && v !== undefined && typeof v !== "object");
  const low = (k) => k.toLowerCase();
  const isLocal = (k) => /hindi|local|regional|_hi$|hi$/i.test(k);
  const nameEntry =
    entries.find(([k]) => low(k).includes(kind) && /name|value|nm/.test(low(k)) && !isLocal(k)) ||
    entries.find(([k]) => /name|value|nm/.test(low(k)) && !isLocal(k)) ||
    entries.find(([k]) => /name|value|nm/.test(low(k)));
  const codeEntry =
    entries.find(([k]) => low(k).includes(kind) && /(cd|code|id|no|number)$/.test(low(k))) ||
    entries.find(([k]) => /(cd|code|id|no|number)$/.test(low(k)));
  return { code: codeEntry ? String(codeEntry[1]).trim() : "", name: nameEntry ? String(nameEntry[1]).trim() : "" };
}
app.get("/api/public/india/states", async (_req, res) => {
  try {
    const rows = await fetchEciList("/common/states");
    const states = rows.map((item) => ({ code: firstValue(item, ["stateCd", "stateCode", "state_code", "code", "id"]), name: firstValue(item, ["stateName", "stateNameEn", "state_name", "stateNm", "name"]) })).filter((item) => item.code && item.name).sort((a, b) => a.name.localeCompare(b.name));
    res.json({ states, source: "Election Commission of India" });
  } catch (error) { res.status(502).json({ message: error.message || "Could not load states from ECI" }); }
});
app.get("/api/public/india/states/:stateCode/districts", async (req, res) => {
  try {
    const stateCode = String(req.params.stateCode || "");
    if (!/^[A-Za-z0-9_-]+$/.test(stateCode)) return res.status(400).json({ message: "Invalid state code" });
    const rows = await fetchEciList(`/common/districts/${encodeURIComponent(stateCode)}`);
    const districts = rows
      .map((item) => {
        const code = firstValue(item, ["districtCd", "districtCode", "district_code", "stateDistrictCode", "districtId", "district_id", "code", "id"]);
        const name = firstValue(item, ["districtValue", "districtName", "districtNameEn", "districtNameEnglish", "districtNm", "district_name", "district", "nameEn", "name"]);
        return code && name ? { code, name } : detectCodeName(item, "district");
      })
      .filter((item) => item.code && item.name)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (!districts.length) {
      console.error("Unmapped district rows for", stateCode, JSON.stringify(rows.slice(0, 2)));
      return res.status(502).json({ message: "Districts came back in an unexpected format" });
    }
    res.json({ districts, source: "Election Commission of India" });
  } catch (error) { res.status(502).json({ message: error.message || "Could not load districts from ECI" }); }
});
app.get("/api/public/india/districts/:districtCode/assemblies", async (req, res) => {
  try {
    const districtCode = String(req.params.districtCode || "");
    if (!/^[A-Za-z0-9_-]+$/.test(districtCode)) return res.status(400).json({ message: "Invalid district code" });
    const rows = await fetchEciList(`/common/acs/${encodeURIComponent(districtCode)}`);
    const assemblies = rows
      .map((item) => {
        const code = firstValue(item, ["acNo", "acNumber", "ac_no", "acCd", "acCode", "constituencyNo", "assemblyConstituencyNo", "code", "id"]);
        const name = firstValue(item, ["acValue", "acName", "acNameEn", "acNameEnglish", "ac_name", "acNm", "constituencyName", "assemblyConstituencyName", "nameEn", "name"]);
        return name ? { code, name } : detectCodeName(item, "ac");
      })
      .filter((item) => item.name)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (!assemblies.length) {
      console.error("Unmapped AC rows for", districtCode, JSON.stringify(rows.slice(0, 2)));
      return res.status(502).json({ message: "Vidhan Sabha list came back in an unexpected format" });
    }
    res.json({ assemblies, source: "Election Commission of India" });
  } catch (error) { res.status(502).json({ message: error.message || "Could not load Vidhan Sabha names from ECI" }); }
});
function normalizeAreaName(value) {
  return String(value || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/^\s*\d+\s*[-.:)]\s*/, "").replace(/\b(vidhan sabha|assembly constituency|zilla parishad|zila parishad|district|parishad)\b/g, " ").replace(/[^a-z0-9]/g, "");
}
function areaNameMatches(left, right) {
  const a = normalizeAreaName(left), b = normalizeAreaName(right);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  if (Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < 6) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return edits + (i < a.length || j < b.length ? 1 : 0) <= 1;
}
app.get("/api/public/reporters-for-area", (req, res) => {
  const state = String(req.query.state || "").trim();
  const district = String(req.query.district || "").trim();
  const vidhanSabha = String(req.query.vidhanSabha || "").trim();
  const parishad = String(req.query.parishad || "").trim();
  if (!state || !district || !vidhanSabha || !parishad) return res.json({ reporters: [] });
  const db = readDb();
  const reporters = db.users
    .filter((u) => u.role === "reporter" && u.accountType === "admin-reporter" && u.status !== "inactive" && !u.blocked
      && areaNameMatches(u.state, state) && areaNameMatches(u.district, district)
      && areaNameMatches(u.vidhanSabha, vidhanSabha) && areaNameMatches(u.parishad, parishad))
    .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")))
    .map((u) => ({ id: u.id, name: u.name, reporterId: u.reporterId || "", state: u.state, district: u.district, vidhanSabha: u.vidhanSabha, parishad: u.parishad }));
  res.json({ reporters });
});

app.get("/api/public/categories", (_req, res) => {
  const db = readDb();
  const counts = new Map();
  db.posts
    .filter((post) => post.status === "published" && post.visibility !== "private")
    .forEach((post) => (post.categories || []).forEach((category) => counts.set(category, (counts.get(category) || 0) + 1)));
  const categories = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  res.json({ categories });
});

app.get("/api/public/posts/:slug", (req, res) => {
  const post = readDb().posts.find((item) =>
    item.status === "published" && item.visibility !== "private" && (item.slug === req.params.slug || item.id === req.params.slug)
  );
  if (!post) return res.status(404).json({ message: "Published post not found" });
  res.json({ post: publicPost(post) });
});

app.post("/api/auth/signup", (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    return res.status(400).json({ message: "Enter your name, a valid email, and a password of at least 8 characters" });
  }
  const db = readDb();
  if (db.users.some((user) => user.email.toLowerCase() === email)) {
    return res.status(409).json({ message: "An account with this email already exists. Please login." });
  }
  const user = { id: makeId("u"), name, email, passwordHash: hashPassword(password), role: "reporter", accessLevel: "submit-only", accountType: "public-contributor", status: "active", blocked: false, createdAt: new Date().toISOString() };
  db.users.push(user);
  writeDb(db);
  res.status(201).json({ message: "Account created. You can now login and submit news for review." });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.users.find((item) => item.email.toLowerCase() === String(email || "").toLowerCase() && verifyPassword(password, item.passwordHash));
  if (!user) return res.status(401).json({ message: "Invalid email or password" });
  if (user.blocked) return res.status(403).json({ message: user.blockMessage || "Your account has been blocked by the administrator." });
  if (user.status === "inactive") return res.status(403).json({ message: "Your account is inactive. Please contact the administrator." });
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, cleanUser(user));
  res.json({ token, user: cleanUser(user) });
});

app.post("/api/auth/logout", auth, (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  sessions.delete(token);
  res.json({ message: "Logged out" });
});
app.get("/api/auth/me", auth, (req, res) => res.json({ user: req.user }));

app.get("/api/users", auth, (req, res) => {
  const db = readDb();
  // Reporters can see public users and other reporters, but never admin accounts.
  const visibleUsers = req.user.role === "reporter" && !canViewEverything(req.user)
    ? db.users.filter((u) => !["full-admin", "read-only-admin"].includes(u.role))
    : db.users;
  res.json({ users: visibleUsers.map((u) => ({ status: "active", blocked: false, ...cleanUser(u) })) });
});

app.post("/api/users", auth, allow("full-admin"), (req, res) => {
  const { name, email, password, role } = req.body;
  const mobile = String(req.body.mobile || "").trim();
  const state = String(req.body.state || "").trim();
  const district = String(req.body.district || "").trim();
  const stateCode = String(req.body.stateCode || "").trim();
  const districtCode = String(req.body.districtCode || "").trim();
  const vidhanSabha = String(req.body.vidhanSabha || "").trim();
  const parishad = String(req.body.parishad || "").trim();
  if (!name || !email || !password || !["full-admin", "read-only-admin", "reporter"].includes(role)) {
    return res.status(400).json({ message: "Name, email, password and valid role are required" });
  }
  const db = readDb();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ message: "Email already exists" });
  if (role === "reporter" && (!mobile || !state || !district || !vidhanSabha || !parishad)) return res.status(400).json({ message: "Reporter mobile, State, District, Vidhan Sabha and Parishad are required" });
  const accessLevel = String(req.body.accessLevel || "submit-only");
  if (role === "reporter" && !["full-access", "view-only", "submit-only"].includes(accessLevel)) return res.status(400).json({ message: "Choose a valid reporter access level" });
  const user = { id: makeId("u"), ...(role === "reporter" ? { reporterId: nextReporterId(db), accessLevel } : {}), name, email, passwordHash: hashPassword(password), role, status: "active", blocked: false, ...(role === "reporter" ? { accountType: "admin-reporter", mobile, state, district, stateCode, districtCode, vidhanSabha, parishad, createdAt: new Date().toISOString() } : {}) };
  db.users.push(user);
  writeDb(db);
  res.status(201).json({ user: cleanUser(user) });
});

app.patch("/api/users/:id", auth, allow("full-admin"), (req, res) => {
  const db = readDb();
  const target = db.users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ message: "Account not found" });
  const { status, blocked, blockMessage } = req.body || {};
  if (status !== undefined && !["active", "inactive"].includes(status)) return res.status(400).json({ message: "Invalid account status" });
  if (target.role === "full-admin" && status === "inactive") return res.status(400).json({ message: "Super Admin accounts cannot be deactivated" });
  if (status !== undefined) target.status = status;
  if (blocked !== undefined) target.blocked = Boolean(blocked);
  if (blockMessage !== undefined) target.blockMessage = String(blockMessage).trim();
  writeDb(db);
  // Immediately invalidate active sessions when an account is disabled or blocked.
  if (target.status === "inactive" || target.blocked) {
    for (const [token, sessionUser] of sessions.entries()) if (sessionUser.id === target.id) sessions.delete(token);
  }
  res.json({ user: cleanUser(target) });
});

app.delete("/api/users/:id", auth, allow("full-admin"), (req, res) => {
  const db = readDb();
  const index = db.users.findIndex((u) => u.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: "Account not found" });
  if (db.users[index].role === "full-admin") return res.status(400).json({ message: "Super Admin accounts cannot be deleted" });
  if (db.users[index].id === req.user.id) return res.status(400).json({ message: "You cannot delete your own account" });
  const [deleted] = db.users.splice(index, 1);
  writeDb(db);
  for (const [token, sessionUser] of sessions.entries()) if (sessionUser.id === deleted.id) sessions.delete(token);
  res.json({ message: "Account deleted successfully" });
});

app.get("/api/posts", auth, (req, res) => {
  const db = readDb();
  let posts = [...db.posts].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const status = String(req.query.status || "").trim();
  const category = String(req.query.category || "").trim();
  const search = String(req.query.search || "").trim().toLowerCase();
  if (status && status !== "all") posts = posts.filter((post) => post.status === status);
  if (category && category !== "all") posts = posts.filter((post) => (post.categories || []).includes(category));
  if (search) {
    posts = posts.filter((post) =>
      `${post.title} ${post.summary} ${post.authorName} ${(post.categories || []).join(" ")} ${(post.tags || []).join(" ")}`
        .toLowerCase()
        .includes(search),
    );
  }
  res.json({ posts });
});

app.get("/api/categories", auth, (_req, res) => {
  const db = readDb();
  const counts = new Map();
  db.posts.forEach((post) => (post.categories || []).forEach((category) => counts.set(category, (counts.get(category) || 0) + 1)));
  const categories = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  res.json({ categories });
});

app.get("/api/posts/:id", auth, (req, res) => {
  const post = readDb().posts.find((item) => item.id === req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  res.json({ post });
});

// Upload several images for a news post. Files are saved on disk in /uploads and their URLs are returned.
// Field name must be "images" (multipart/form-data), up to 10 files, 5 MB each.
app.post("/api/uploads/images", auth, allow("full-admin", "reporter"), upload.array("images", 10), (req, res) => {
  const files = req.files || [];
  if (!files.length) return res.status(400).json({ message: "Please select at least one image" });
  const images = files.map((file) => `${BACKEND_URL()}/uploads/${file.filename}`);
  res.status(201).json({ images });
});

app.post("/api/posts", auth, allow("full-admin", "reporter"), (req, res) => {
  const { title, summary, content, categories = [], tags = [], images = [], visibility = "public", excludeFromGoogleNews = false, action = "draft" } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
  const now = new Date().toISOString();
  const id = makeId("p");
  const cleanImages = cleanImageList(images);
  const post = {
    id,
    title: title.trim(),
    summary: summary || "",
    excerpt: summary || "",
    content: content || "",
    categories: Array.isArray(categories) ? categories : [],
    tags: Array.isArray(tags) ? tags : [],
    authorId: req.user.id,
    authorName: req.user.name,
    slug: slugify(title, id),
    // First uploaded image is the cover image; the rest are in `images`.
    image: cleanImages[0] || `https://picsum.photos/seed/${encodeURIComponent(id)}/1200/700`,
    images: cleanImages,
    date: new Date(now).toLocaleDateString("hi-IN", { day: "2-digit", month: "long", year: "numeric" }),
    status: req.user.role === "reporter" ? (action === "review" ? "pending" : "draft") : action === "publish" ? "published" : "draft",
    visibility,
    excludeFromGoogleNews: Boolean(excludeFromGoogleNews),
    createdAt: now,
    updatedAt: now,
    ...(action === "publish" ? { publishedAt: now } : {})
  };
  const db = readDb(); db.posts.push(post); writeDb(db);
  res.status(201).json({ post });
});

// Public contributor form. Every submission enters the dashboard as pending and cannot publish itself.
app.post("/api/community/posts", auth, allow("reporter"), upload.single("image"), (req, res) => {
  const areaName = String(req.body.areaName || "").trim();
  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim();
  const category = String(req.body.category || "क्षेत्रीय").trim();
  const db = readDb();
  if (!areaName || !title || !description) return res.status(400).json({ message: "Area name, news title, and description are required" });
  if (!req.file) return res.status(400).json({ message: "Please upload a news image" });
  const now = new Date().toISOString();
  const id = makeId("p");
  const slug = `${slugify(title, id)}-${id.slice(-5)}`;
  const image = `${BACKEND_URL()}/uploads/${req.file.filename}`;
  const post = {
    id, title, summary: description.slice(0, 300), excerpt: description.slice(0, 300), content: `<p>${description.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "</p><p>")}</p>`,
    areaName, categories: [category], category, tags: [category, areaName], authorId: req.user.id, authorName: req.user.name,
    slug, image, images: [image], date: new Date(now).toLocaleDateString("hi-IN", { day: "2-digit", month: "long", year: "numeric" }),
    status: "pending", visibility: "public", excludeFromGoogleNews: false, createdAt: now, updatedAt: now,
  };
  db.posts.push(post); writeDb(db);
  res.status(201).json({ message: "News submitted successfully for admin approval", post });
});

app.put("/api/posts/:id", auth, superAdminOnly, (req, res) => {
  const db = readDb();
  const post = db.posts.find((item) => item.id === req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  const { title, summary, content, categories = [], tags = [], images, visibility = "public", excludeFromGoogleNews = false, action = "draft" } = req.body;
  post.title = title?.trim() || post.title;
  post.summary = summary || "";
  post.excerpt = summary || "";
  post.content = content || "";
  post.categories = Array.isArray(categories) ? categories : [];
  post.tags = Array.isArray(tags) ? tags : [];
  post.slug = post.slug || slugify(post.title, post.id);
  // If the client sent an images array, use it; otherwise keep what the post already has.
  if (Array.isArray(images)) post.images = cleanImageList(images);
  else post.images = cleanImageList(post.images);
  // First image is the cover. If all images were removed, fall back to a placeholder.
  post.image = post.images[0] || (Array.isArray(images) ? `https://picsum.photos/seed/${encodeURIComponent(post.id)}/1200/700` : (post.image || `https://picsum.photos/seed/${encodeURIComponent(post.id)}/1200/700`));
  post.date = post.date || new Date(post.publishedAt || post.updatedAt || post.createdAt).toLocaleDateString("hi-IN", { day: "2-digit", month: "long", year: "numeric" });
  post.visibility = visibility;
  post.excludeFromGoogleNews = Boolean(excludeFromGoogleNews);
  post.updatedAt = new Date().toISOString();
  if (action === "publish") { post.status = "published"; post.publishedAt = new Date().toISOString(); }
  if (action === "draft") post.status = "draft";
  writeDb(db); res.json({ post });
});

app.post("/api/posts/:id/approve", auth, superAdminOnly, (req, res) => {
  const db = readDb();
  const post = db.posts.find((item) => item.id === req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  post.status = "published"; post.updatedAt = new Date().toISOString(); post.publishedAt = post.updatedAt;
  writeDb(db); res.json({ post });
});

app.delete("/api/posts/:id", auth, superAdminOnly, (req, res) => {
  const db = readDb();
  const index = db.posts.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Post not found" });
  db.posts.splice(index, 1); db.grievanceFeedback = (db.grievanceFeedback || []).filter((f) => f.postId !== req.params.id); writeDb(db); res.json({ message: "Post deleted" });
});

// Posts submitted by the logged-in public user (all statuses) so they can track them and send feedback once published.
app.get("/api/community/posts/mine", auth, (req, res) => {
  const db = readDb();
  const posts = db.posts.filter((p) => p.authorId === req.user.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json({ posts });
});
app.post("/api/community/posts/:id/feedback", auth, (req, res) => {
  const message = String(req.body.message || "").trim();
  if (message.length < 3) return res.status(400).json({ message: "Please enter feedback" });
  const db = readDb();
  const post = db.posts.find((x) => x.id === req.params.id && x.authorId === req.user.id);
  if (!post) return res.status(404).json({ message: "Your news post was not found" });
  if (post.status !== "published") return res.status(400).json({ message: "Feedback is available after your news is published" });
  const feedback = { id: makeId("gf"), type: "news", postId: post.id, grievanceId: post.id, grievanceTitle: post.title, userId: req.user.id, userName: req.user.name, message, createdAt: new Date().toISOString() };
  db.grievanceFeedback ||= []; db.grievanceFeedback.push(feedback); writeDb(db);
  res.status(201).json({ feedback });
});

// Community grievances and feedback workflow
app.post("/api/community/grievances", auth, allow("reporter"), upload.single("image"), (req, res) => {
  const areaName = String(req.body.areaName || "").trim();
  const state = String(req.body.state || "").trim();
  const district = String(req.body.district || "").trim();
  const vidhanSabha = String(req.body.vidhanSabha || "").trim();
  const parishad = String(req.body.parishad || "").trim();
  const reporterId = String(req.body.reporterId || "").trim();
  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim();
  const db = readDb();
  if (!areaName || !state || !district || !vidhanSabha || !parishad || title.length < 5 || description.length < 10) return res.status(400).json({ message: "Area, State, District, Vidhan Sabha, Parishad, grievance title and description are required" });
  let assignedReporter = null;
  if (reporterId) {
    assignedReporter = db.users.find((u) => u.id === reporterId && u.role === "reporter" && u.accountType === "admin-reporter" && u.status !== "inactive" && !u.blocked && areaNameMatches(u.state, state) && areaNameMatches(u.district, district) && areaNameMatches(u.vidhanSabha, vidhanSabha) && areaNameMatches(u.parishad, parishad));
    if (!assignedReporter) return res.status(400).json({ message: "The selected reporter is not registered for this State, District, Vidhan Sabha and Parishad" });
  }
  const now = new Date().toISOString();
  const grievance = { id: makeId("g"), areaName, state, district, vidhanSabha, parishad, ...(assignedReporter ? { assignedReporterId: assignedReporter.id, assignedReporterName: assignedReporter.name, assignedReporterEmail: assignedReporter.email } : {}), title, description, image: req.file ? `${BACKEND_URL()}/uploads/${req.file.filename}` : "", authorId: req.user.id, authorName: req.user.name, status: "pending", createdAt: now, updatedAt: now };
  db.grievances ||= []; db.grievances.push(grievance); writeDb(db);
  res.status(201).json({ message: "Grievance submitted for review", grievance });
});
app.get("/api/community/grievances/mine", auth, (req, res) => {
  const db = readDb(); res.json({ grievances: (db.grievances || []).filter(g => g.authorId === req.user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
});
app.get("/api/public/grievances", (_req, res) => {
  const db = readDb(); res.json({ grievances: (db.grievances || []).filter(g => g.status === "published").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) });
});
app.get("/api/grievances", auth, allow("full-admin", "read-only-admin", "reporter"), (_req, res) => {
  const db = readDb(); res.json({ grievances: [...(db.grievances || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
});
app.post("/api/grievances/:id/publish", auth, allow("full-admin"), (req, res) => {
  const db = readDb(); const g = (db.grievances || []).find(x => x.id === req.params.id);
  if (!g) return res.status(404).json({ message: "Grievance not found" });
  g.status = "published"; g.updatedAt = new Date().toISOString(); writeDb(db); res.json({ grievance: g });
});
app.delete("/api/grievances/:id", auth, allow("full-admin"), (req, res) => {
  const db = readDb(); db.grievances ||= []; const n = db.grievances.findIndex(g => g.id === req.params.id);
  if (n < 0) return res.status(404).json({ message: "Grievance not found" }); db.grievances.splice(n, 1); db.grievanceFeedback = (db.grievanceFeedback || []).filter(f => f.grievanceId !== req.params.id); writeDb(db); res.json({ message: "Grievance deleted" });
});
app.post("/api/community/grievances/:id/feedback", auth, (req, res) => {
  const message = String(req.body.message || "").trim(); if (message.length < 3) return res.status(400).json({ message: "Please enter feedback" });
  const db = readDb(); const g = (db.grievances || []).find(x => x.id === req.params.id && x.status === "published"); if (!g) return res.status(404).json({ message: "Published grievance not found" });
  const feedback = { id: makeId("gf"), type: "grievance", grievanceId: g.id, grievanceTitle: g.title, userId: req.user.id, userName: req.user.name, message, createdAt: new Date().toISOString() }; db.grievanceFeedback ||= []; db.grievanceFeedback.push(feedback); writeDb(db); res.status(201).json({ feedback });
});
app.get("/api/grievance-feedback", auth, allow("full-admin", "read-only-admin", "reporter"), (_req, res) => res.json({ feedback: (readDb().grievanceFeedback || []).map((f) => ({ type: "grievance", ...f })).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))) }));
app.delete("/api/grievance-feedback/:id", auth, allow("full-admin"), (req, res) => { const db = readDb(); db.grievanceFeedback ||= []; const n = db.grievanceFeedback.findIndex(f => f.id === req.params.id); if (n < 0) return res.status(404).json({ message: "Feedback not found" }); db.grievanceFeedback.splice(n, 1); writeDb(db); res.json({ message: "Feedback deleted" }); });

app.use((err, _req, res, _next) => { console.error(err); const status = err instanceof multer.MulterError ? 400 : 400; res.status(status).json({ message: err.message || "Server error" }); });

const PORT = process.env.PORT || 5013;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`India Voice API running on port ${PORT}`);
});
