import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5013";
const roleLabel = {
  "full-admin": "Super Admin",
  "read-only-admin": "Admin Read Only",
  reporter: "Reporter",
};
const accessLevelLabels = {
  "full-access": "Read + Edit + Publish",
  "view-only": "View everything only",
  "submit-only": "Add posts → approval",
};
const hasFullAccess = (user) => user?.role === "full-admin" || user?.fullAccess === true || user?.accessLevel === "full-access";
const isViewOnly = (user) => user?.role === "read-only-admin" || user?.accessLevel === "view-only";
const canSubmitPosts = (user) => hasFullAccess(user) || (user?.role === "reporter" && !isViewOnly(user));
const userRoleLabel = (user) => user?.role === "reporter" ? (user.accountType === "public-contributor" ? "Reporter" : accessLevelLabels[user.accessLevel] || (user.fullAccess ? accessLevelLabels["full-access"] : accessLevelLabels["submit-only"])) : roleLabel[user?.role];
const categories = [
  "क्षेत्रीय",
  "देश",
  "दुनिया",
  "राजनीति",
  "बिज़नेस",
  "तकनीक",
  "खेल",
  "ऑटो",
  "मनोरंजन",
  "एस्ट्रोलॉजी",
  "जीवन मंत्रा",
  "जरा हटके",
];

// Image upload limits (must match the backend multer config)
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

async function api(path, options = {}) {
  const token = localStorage.getItem("iv_token");
  // FormData must NOT get a manual Content-Type, the browser adds the multipart boundary itself.
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(API + "/api" + path, {
    ...options,
    headers: {
      ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && path !== "/auth/login") {
    localStorage.removeItem("iv_token");
    localStorage.removeItem("iv_user");
    window.dispatchEvent(new Event("iv-session-expired"));
  }
  if (!response.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("iv_user") || "null");
    } catch {
      return null;
    }
  });

  const value = useMemo(() => ({ user, setUser }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  return useContext(AuthContext);
}

function Protected() {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    setChecking(true);
    async function checkSession() {
      const token = localStorage.getItem("iv_token");
      if (!token) {
        localStorage.removeItem("iv_user");
        if (active) { setUser(null); setChecking(false); }
        return;
      }
      try {
        const data = await api("/auth/me");
        if (active) {
          localStorage.setItem("iv_user", JSON.stringify(data.user));
          setUser(data.user);
        }
      } catch {
        localStorage.removeItem("iv_token");
        localStorage.removeItem("iv_user");
        if (active) setUser(null);
      } finally {
        if (active) setChecking(false);
      }
    }
    const expireSession = () => {
      localStorage.removeItem("iv_token");
      localStorage.removeItem("iv_user");
      setUser(null);
    };
    const onStorage = (event) => {
      if (event.key === "iv_token" && !event.newValue) expireSession();
    };
    window.addEventListener("iv-session-expired", expireSession);
    window.addEventListener("storage", onStorage);
    checkSession();
    return () => {
      active = false;
      window.removeEventListener("iv-session-expired", expireSession);
      window.removeEventListener("storage", onStorage);
    };
  }, [location.pathname, setUser]);

  if (checking) return <div className="loading-screen">Checking login...</div>;
  if (!user || !localStorage.getItem("iv_token")) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("iv_token", data.token);
      localStorage.setItem("iv_user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand-mark">IV</div>
        <h1>India Voice</h1>
        <p className="muted">Dashboard Login</p>
        <form onSubmit={submit}>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" required />
          </label>
          {error && <div className="error-box">{error}</div>}
          <button className="primary full" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [postsOpen, setPostsOpen] = useState(location.pathname.startsWith("/dashboard/posts"));
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith("/dashboard/posts")) setPostsOpen(true);
    setProfileOpen(false);
  }, [location.pathname]);

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Local logout still happens if the server session has already expired.
    }
    localStorage.removeItem("iv_token");
    localStorage.removeItem("iv_user");
    setUser(null);
    navigate("/login", { replace: true });
  }

  const canEdit = hasFullAccess(user);
  const canPost = canSubmitPosts(user);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>IV</span>
          <div>
            <b>India Voice</b>
            <small>Super Admin Panel</small>
          </div>
        </div>
        <nav>
          <button className={location.pathname === "/dashboard" ? "nav-item active" : "nav-item"} onClick={() => navigate("/dashboard")}>
            <span>⌂</span> Dashboard
          </button>
          <button className={location.pathname.startsWith("/dashboard/users") ? "nav-item active" : "nav-item"} onClick={() => navigate("/dashboard/users")}>
            <span>♟</span> Users
          </button>
          <button className={location.pathname.startsWith("/dashboard/posts") ? "nav-item active" : "nav-item"} onClick={() => setPostsOpen((v) => !v)}>
            <span>✎</span> Posts <span className="chevron">{postsOpen ? "⌃" : "⌄"}</span>
          </button>
          {postsOpen && (
            <div className="subnav">
              {canPost && (
                <button onClick={() => navigate("/dashboard/posts/add")} className={location.pathname === "/dashboard/posts/add" ? "subactive" : ""}>
                  Add Post
                </button>
              )}
              <button onClick={() => navigate("/dashboard/posts")} className={location.pathname === "/dashboard/posts" ? "subactive" : ""}>
                All Posts
              </button>
            </div>
          )}
          <button className={location.pathname.startsWith("/dashboard/grievances") ? "nav-item active" : "nav-item"} onClick={() => navigate("/dashboard/grievances")}><span>⚑</span> Manage Grievance</button>
          <button className={location.pathname.startsWith("/dashboard/grievance-feedback") ? "nav-item active" : "nav-item"} onClick={() => navigate("/dashboard/grievance-feedback")}><span>✉</span> Grievance Feedback</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="role-chip">{userRoleLabel(user)}</div>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <span className="top-title">Dashboard</span>
          <div className="profile-wrap">
            <button className="profile-button" onClick={() => setProfileOpen((v) => !v)}>
              <span className="avatar">{user?.name?.[0] || "U"}</span>
              <span>
                <b>{user?.name}</b>
                <small>{userRoleLabel(user)}</small>
              </span>
              <span>⌄</span>
            </button>
            {profileOpen && (
              <div className="profile-menu">
                <div className="profile-name">{user?.name}</div>
                <div className="profile-email">{user?.email}</div>
                <button onClick={logout}>Logout</button>
              </div>
            )}
          </div>
        </header>
        <main className="main-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function DashboardHome() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/posts"), api("/users")])
      .then(([p, u]) => {
        setPosts(p.posts || []);
        setUsers(u.users || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section>
      <div className="page-head">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome back. Manage your India Voice content from here.</p>
        </div>
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="notice blue">You are now using the India Voice admin dashboard.</div>
      <div className="stats">
        <div className="stat"><span>Published Posts</span><strong>{posts.filter((p) => p.status === "published").length}</strong></div>
        <div className="stat"><span>Pending Approval</span><strong>{posts.filter((p) => p.status === "pending").length}</strong></div>
        <div className="stat"><span>Drafts</span><strong>{posts.filter((p) => p.status === "draft").length}</strong></div>
        <div className="stat"><span>Users</span><strong>{users.length}</strong></div>
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-title">Recent Posts</div>
          {posts.slice(0, 6).map((p) => (
            <div className="activity" key={p.id}>
              <div><b>{p.title || "(no title)"}</b><small>{p.authorName}</small></div>
              <span className={`status ${p.status}`}>{p.status}</span>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-title">Roles</div>
          <div className="role-row"><b>Super Admin</b><span>Read + Edit + Publish</span></div>
          <div className="role-row"><b>Admin Read Only</b><span>View everything only</span></div>
          <div className="role-row"><b>Reporter</b><span>Add posts → approval</span></div>
        </div>
      </div>
    </section>
  );
}

function ReporterLocationDropdowns({ onChange }) {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [stateCode, setStateCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [vidhanSabha, setVidhanSabha] = useState("");
  const [parishad, setParishad] = useState("");
  const [loading, setLoading] = useState({ states: true, districts: false, assemblies: false });
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    let active = true;
    api("/public/india/states")
      .then((data) => { if (active) setStates(data.states || []); })
      .catch((err) => { if (active) setLocationError(err.message || "Could not load states"); })
      .finally(() => { if (active) setLoading((current) => ({ ...current, states: false })); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!stateCode) return;
    let active = true;
    setLoading((current) => ({ ...current, districts: true }));
    setLocationError("");
    api(`/public/india/states/${encodeURIComponent(stateCode)}/districts`)
      .then((data) => { if (active) setDistricts(data.districts || []); })
      .catch((err) => { if (active) setLocationError(err.message || "Could not load districts"); })
      .finally(() => { if (active) setLoading((current) => ({ ...current, districts: false })); });
    return () => { active = false; };
  }, [stateCode]);

  useEffect(() => {
    if (!districtCode) return;
    let active = true;
    setLoading((current) => ({ ...current, assemblies: true }));
    setLocationError("");
    api(`/public/india/districts/${encodeURIComponent(districtCode)}/assemblies`)
      .then((data) => { if (active) setAssemblies(data.assemblies || []); })
      .catch((err) => { if (active) setLocationError(err.message || "Could not load Vidhan Sabha names"); })
      .finally(() => { if (active) setLoading((current) => ({ ...current, assemblies: false })); });
    return () => { active = false; };
  }, [districtCode]);

  function selectState(code) {
    const selected = states.find((item) => item.code === code);
    setStateCode(code); setState(selected?.name || "");
    setDistricts([]); setAssemblies([]); setDistrictCode(""); setDistrict(""); setVidhanSabha(""); setParishad(""); setLocationError("");
    onChange({ stateCode: code, state: selected?.name || "", districtCode: "", district: "", vidhanSabha: "", parishad: "" });
  }
  function selectDistrict(code) {
    const selected = districts.find((item) => item.code === code);
    const nextDistrict = selected?.name || "";
    setDistrictCode(code); setDistrict(nextDistrict); setAssemblies([]); setVidhanSabha("");
    setParishad(nextDistrict ? `${nextDistrict} Parishad` : ""); setLocationError("");
    onChange({ state, stateCode, districtCode: code, district: nextDistrict, vidhanSabha: "", parishad: nextDistrict ? `${nextDistrict} Parishad` : "" });
  }
  function selectAssembly(name) {
    setVidhanSabha(name); onChange({ state, district, stateCode, districtCode, vidhanSabha: name, parishad });
  }

  return <div className="location-dropdown-grid">
    <label>State
      <select required value={stateCode} onChange={(event) => selectState(event.target.value)}>
        <option value="">{loading.states ? "Loading states…" : "Select State / UT"}</option>
        {states.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
      </select>
    </label>
    <label>District
      <select required disabled={!stateCode || loading.districts} value={districtCode} onChange={(event) => selectDistrict(event.target.value)}>
        <option value="">{loading.districts ? "Loading districts…" : districts.length ? "Select District" : stateCode ? "No districts returned" : "Select District"}</option>
        {districts.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
      </select>
    </label>
    <label>Vidhan Sabha
      <select required disabled={!districtCode || loading.assemblies} value={vidhanSabha} onChange={(event) => selectAssembly(event.target.value)}>
        <option value="">{loading.assemblies ? "Loading Vidhan Sabha…" : assemblies.length ? "Select Vidhan Sabha" : districtCode ? "No Vidhan Sabha returned" : "Select Vidhan Sabha"}</option>
        {assemblies.map((item, index) => <option key={`${item.code || item.name}-${index}`} value={item.name}>{item.name} Vidhan Sabha</option>)}
      </select>
    </label>
    <label>Parishad
      <select required disabled={!district} value={parishad} onChange={(event) => { setParishad(event.target.value); onChange({ state, district, stateCode, districtCode, vidhanSabha, parishad: event.target.value }); }}>
        <option value="">Select Parishad</option>
        {district && <option value={`${district} Parishad`}>{district} Parishad</option>}
      </select>
    </label>
    {locationError && <p className="error-box location-error">{locationError}</p>}
  </div>;
}

function UsersPage() {
  const { user } = useAuth();
  const canEdit = hasFullAccess(user);
  const isReporter = user?.role === "reporter" && !hasFullAccess(user) && !isViewOnly(user);
  const [users, setUsers] = useState([]);
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState(isReporter ? "users" : "admins");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const emptyForm = { name: "", email: "", password: "", role: "reporter", mobile: "", state: "", stateCode: "", district: "", districtCode: "", vidhanSabha: "", parishad: "", accessLevel: "submit-only" };
  const [form, setForm] = useState(emptyForm);

  async function load() {
    try {
      const data = await api("/users");
      setUsers(data.users || []);
      setError("");
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault(); setError("");
    try {
      await api("/users", { method: "POST", body: JSON.stringify({ ...form, role: "reporter" }) });
      setForm(emptyForm);
      setShow(false); setTab("reporters"); setPage(1); await load();
    } catch (err) { setError(err.message); }
  }

  async function updateAccount(account, changes) {
    setError("");
    try { await api(`/users/${account.id}`, { method: "PATCH", body: JSON.stringify(changes) }); await load(); }
    catch (err) { setError(err.message); }
  }
  async function removeAccount(account) {
    if (!window.confirm(`Delete ${account.name}'s account permanently?`)) return;
    setError("");
    try { await api(`/users/${account.id}`, { method: "DELETE" }); await load(); }
    catch (err) { setError(err.message); }
  }
  async function toggleBlock(account) {
    if (account.blocked) { await updateAccount(account, { blocked: false, blockMessage: "" }); return; }
    const message = window.prompt("Enter the message this user will see when trying to log in:", "Your account has been blocked by the administrator. Please contact support.");
    if (message === null) return;
    if (!message.trim()) { setError("Please enter a block message."); return; }
    await updateAccount(account, { blocked: true, blockMessage: message.trim() });
  }

  const admins = users.filter((u) => ["full-admin", "read-only-admin"].includes(u.role));
  const publicUsers = users.filter((u) => u.role === "reporter" && u.accountType === "public-contributor");
  const reporters = users.filter((u) => u.role === "reporter" && u.accountType !== "public-contributor");
  const currentList = tab === "admins" ? admins : tab === "users" ? publicUsers : reporters;
  const filtered = currentList.filter((u) => `${u.name} ${u.email} ${u.mobile || ""} ${u.role} ${u.reporterId || ""}`.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  function changeTab(next) { setTab(next); setPage(1); setSearch(""); }
  return (
    <section>
      <div className="page-head">
        <div><h2>Account Management</h2><p>Manage admins, website users and admin-added reporters from one place.</p></div>
        {canEdit && <button className="primary" onClick={() => { setForm(emptyForm); setShow(true); }}>＋ Add Reporter</button>}
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="post-tabs account-tabs">
        {!isReporter && <button className={tab === "admins" ? "selected" : ""} onClick={() => changeTab("admins")}>Admins ({admins.length})</button>}
        <button className={tab === "users" ? "selected" : ""} onClick={() => changeTab("users")}>Users ({publicUsers.length})</button>
        <button className={tab === "reporters" ? "selected" : ""} onClick={() => changeTab("reporters")}>Reporters ({reporters.length})</button>
      </div>
      <div className="toolbar"><input placeholder={`Search ${tab}...`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
      <div className="panel table-panel">
        <table>
          <thead><tr><th>Name / Email</th>{tab === "reporters" && <th>Reporter ID</th>}<th>Mobile</th>{tab !== "admins" && <><th>Vidhan Sabha</th><th>Parishad</th></>}<th>Role</th><th>Status</th>{canEdit && <th>Actions</th>}</tr></thead>
          <tbody>
            {visible.map((u) => (
              <tr key={u.id}>
                <td><b>{u.name}</b><small>{u.email}</small></td>
                {tab === "reporters" && <td>{u.reporterId || "—"}</td>}
                <td>{u.mobile || "—"}</td>
                {tab !== "admins" && <><td>{u.vidhanSabha || "—"}</td><td>{u.parishad || "—"}</td></>}
                <td><span className="role-badge">{userRoleLabel(u) || "User"}</span></td>
                <td><span className={`status ${u.blocked ? "blocked" : (u.status || "active")}`}>{u.blocked ? "Blocked" : (u.status || "Active")}</span></td>
                {canEdit && <td className="account-actions">
                  {u.role !== "full-admin" && <button onClick={() => updateAccount(u, { status: (u.status || "active") === "active" ? "inactive" : "active" })}>{(u.status || "active") === "active" ? "Set Inactive" : "Set Active"}</button>}
                  {tab === "users" && <button onClick={() => toggleBlock(u)}>{u.blocked ? "Unblock" : "Block"}</button>}
                  {u.role !== "full-admin" && <button className="danger-text" onClick={() => removeAccount(u)}>Delete</button>}
                </td>}
              </tr>
            ))}
            {!visible.length && <tr><td colSpan={tab === "admins" ? (canEdit ? 5 : 4) : tab === "reporters" ? (canEdit ? 8 : 7) : (canEdit ? 7 : 6)} className="empty-cell">No {tab} found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="pagination-row"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><div><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button><b>Page {page} of {totalPages}</b><button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button></div></div>
      {show && (
        <div className="modal-backdrop"><div className="modal">
          <div className="modal-head"><h3>Add Reporter</h3><button onClick={() => setShow(false)}>×</button></div>
          <form onSubmit={add}>
            <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label>Password<input required minLength="8" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            <label>Mobile Number<input required type="tel" pattern="[0-9+() -]{10,16}" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Reporter mobile number" /></label>
            <ReporterLocationDropdowns onChange={(location) => setForm((current) => ({ ...current, ...location }))} />
            <label>Role
              <select value={form.accessLevel} onChange={(e) => setForm({ ...form, accessLevel: e.target.value })}>
                <option value="full-access">Read + Edit + Publish</option>
                <option value="view-only">View everything only</option>
                <option value="submit-only">Add posts → approval</option>
              </select>
            </label>
            <button className="primary full">Create Reporter</button>
          </form>
        </div></div>
      )}
    </section>
  );
}

function PostsPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "full-admin";
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function load() {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (search.trim()) params.set("search", search.trim());
      const data = await api(`/posts${params.toString() ? `?${params.toString()}` : ""}`);
      setPosts(data.posts || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 150);
    return () => clearTimeout(timer);
  }, [statusFilter, categoryFilter, search]);

  async function approve(id) {
    try { await api(`/posts/${id}/approve`, { method: "POST" }); await load(); } catch (err) { setError(err.message); }
  }

  async function del(id) {
    if (!window.confirm("Delete this post?")) return;
    try { await api(`/posts/${id}`, { method: "DELETE" }); await load(); } catch (err) { setError(err.message); }
  }

  return (
    <section>
      <div className="page-head">
        <div><h2>All Posts</h2><p>See published news, drafts and approval articles category wise.</p></div>
        {canSubmitPosts(user) && <button className="primary" onClick={() => navigate("/dashboard/posts/add")}>＋ Add Post</button>}
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="post-tabs">
        <button onClick={() => setStatusFilter("all")}>All</button>
        <button onClick={() => setStatusFilter("published")}>Published</button>
        <button onClick={() => setStatusFilter("draft")}>Drafts</button>
        <button onClick={() => setStatusFilter("pending")}>Pending</button>
      </div>
      <div className="filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option><option value="published">Published</option><option value="pending">Pending</option><option value="draft">Drafts</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <button onClick={() => { setStatusFilter("published"); setCategoryFilter("all"); setSearch(""); }}>Published News</button>
        <input placeholder="Search Posts" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="panel table-panel">
        <table className="posts-table">
          <thead><tr><th>Title</th><th>Area</th><th>Author / Assigned Reporter</th><th>Categories</th><th>Tags</th><th>Status / Date</th><th>Actions</th></tr></thead>
          <tbody>
            {posts.length ? posts.map((p) => (
              <tr key={p.id}>
                <td>{(canEdit || (user?.role === "reporter" && !isViewOnly(user))) ? <button className="title-link" onClick={() => navigate(`/dashboard/posts/edit/${p.id}`)}>{p.title || "(no title)"}</button> : <span>{p.title || "(no title)"}</span>}</td>
                <td>{p.areaName || "—"}</td>
                <td>{p.authorName}{p.assignedReporterName ? <small>Reporter: {p.assignedReporterName}</small> : null}</td>
                <td>{(p.categories || []).join(", ") || "—"}</td>
                <td>{(p.tags || []).join(", ") || "—"}</td>
                <td><span className={`status ${p.status}`}>{p.status}</span><small>{new Date(p.updatedAt).toLocaleString()}</small></td>
                <td className="actions">
                  {canEdit && p.status === "pending" && <button onClick={() => approve(p.id)} className="approve">Publish</button>}
                  {canEdit && <button onClick={() => navigate(`/dashboard/posts/edit/${p.id}`)}>Edit</button>}
                  {canEdit && <button onClick={() => del(p.id)} className="danger-text">Delete</button>}
                </td>
              </tr>
            )) : <tr><td colSpan="7" className="muted">No posts found for this filter.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RichEditor({ value, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || "";
  }, [value]);

  function cmd(command, arg = null) {
    document.execCommand(command, false, arg);
    onChange(ref.current?.innerHTML || "");
    ref.current?.focus();
  }

  return (
    <div className="editor-wrap">
      <div className="editor-tabs"><button className="selected">Visual</button><button type="button">Code</button></div>
      <div className="editor-toolbar">
        <select onChange={(e) => cmd("formatBlock", e.target.value)} defaultValue="p"><option value="p">Paragraph</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option></select>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); cmd("bold"); }}><b>B</b></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); cmd("italic"); }}><i>I</i></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); cmd("insertUnorderedList"); }}>☷</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); cmd("insertOrderedList"); }}>☷</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); cmd("formatBlock", "blockquote"); }}>❝</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); cmd("justifyLeft"); }}>≡</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); cmd("justifyCenter"); }}>≡</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); cmd("justifyRight"); }}>≡</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); const url = window.prompt("Link URL"); if (url) cmd("createLink", url); }}>🔗</button>
      </div>
      <div ref={ref} className="rich-editor" contentEditable suppressContentEditableWarning onInput={(e) => onChange(e.currentTarget.innerHTML)} />
      <div className="word-count">Word count: {(value.replace(/<[^>]+>/g, " ").trim().match(/\S+/g) || []).length}</div>
    </div>
  );
}

function AddPost({ edit = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const canPublish = user?.role === "full-admin";
  const [form, setForm] = useState({ title: "", summary: "", content: "", categories: [], tags: [], images: [], visibility: "public", excludeFromGoogleNews: false });
  const [loading, setLoading] = useState(edit);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  // ---- Multiple image upload state ----
  const [selectedFiles, setSelectedFiles] = useState([]); // files chosen but not uploaded yet
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const previews = useMemo(
    () => selectedFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [selectedFiles],
  );
  // Free the temporary preview URLs when the list changes or the page closes.
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  useEffect(() => {
    if (!edit || !id) return;
    let active = true;
    api(`/posts/${id}`)
      .then((data) => {
        if (!active) return;
        const post = data.post;
        setForm({
          title: post.title || "",
          summary: post.summary || post.excerpt || "",
          content: post.content || "",
          categories: Array.isArray(post.categories) ? post.categories : [],
          tags: Array.isArray(post.tags) ? post.tags : [],
          images: Array.isArray(post.images) ? post.images : [],
          visibility: post.visibility || "public",
          excludeFromGoogleNews: Boolean(post.excludeFromGoogleNews),
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [edit, id]);

  function chooseImages(e) {
    setUploadError("");
    const picked = Array.from(e.target.files || []);
    const valid = picked.filter((file) => IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_SIZE);
    if (valid.length !== picked.length) setUploadError("Only JPG, PNG, WEBP or GIF files up to 5 MB are allowed. Some files were skipped.");
    const room = Math.max(0, MAX_IMAGES - form.images.length);
    if (valid.length + selectedFiles.length > room) setUploadError(`You can have at most ${MAX_IMAGES} images per post.`);
    setSelectedFiles((current) => [...current, ...valid].slice(0, room));
    e.target.value = ""; // lets the user pick the same file again
  }
  function removeSelected(index) {
    setSelectedFiles((current) => current.filter((_, i) => i !== index));
  }
  function removeUploaded(url) {
    setForm((current) => ({ ...current, images: current.images.filter((x) => x !== url) }));
  }
  function makeCover(url) {
    setForm((current) => ({ ...current, images: [url, ...current.images.filter((x) => x !== url)] }));
  }
  async function uploadImages() {
    if (!selectedFiles.length) return;
    setUploading(true);
    setUploadError("");
    try {
      const body = new FormData();
      selectedFiles.forEach((file) => body.append("images", file)); // field name must be "images"
      const data = await api("/uploads/images", { method: "POST", body });
      setForm((current) => ({ ...current, images: [...current.images, ...(data.images || [])] }));
      setSelectedFiles([]);
    } catch (err) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save(action) {
    setMessage("");
    setError("");
    if (selectedFiles.length) {
      setError("You have selected images that are not uploaded yet. Click Upload first or remove them.");
      return;
    }
    try {
      const path = edit ? `/posts/${id}` : "/posts";
      const data = await api(path, { method: edit ? "PUT" : "POST", body: JSON.stringify({ ...form, action }) });
      setMessage(action === "publish" ? "Article published successfully." : action === "review" ? "Article submitted for review." : "Draft saved successfully.");
      if (!edit && action !== "draft") navigate(`/dashboard/posts/edit/${data.post.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="loading">Loading post...</div>;
  if (isViewOnly(user)) return <div className="notice blue">This account has view-only access.</div>;
  if (edit && user?.role === "reporter") {
    const contentText = typeof window === "undefined"
      ? form.content.replace(/<[^>]*>/g, " ")
      : new DOMParser().parseFromString(form.content, "text/html").body.textContent || "";
    return (
      <section>
        <div className="page-head"><div><h2>{form.title || "News post"}</h2><p>Reporter accounts can view news but cannot edit it.</p></div><button onClick={() => navigate("/dashboard/posts")}>Back to All Posts</button></div>
        <div className="panel">
          <p><b>Summary:</b> {form.summary || "—"}</p>
          <p className="mt-4 whitespace-pre-wrap"><b>Content:</b> {contentText || "—"}</p>
          <p className="mt-4"><b>Categories:</b> {form.categories.join(", ") || "—"}</p>
          <p className="mt-2"><b>Tags:</b> {form.tags.join(", ") || "—"}</p>
          {form.images.length > 0 && <div className="thumb-grid">{form.images.map((url) => <div className="thumb" key={url}><img src={url} alt="" /></div>)}</div>}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="page-head">
        <div><h2>{edit ? "Edit Post" : "Add New Post"}</h2><p>Create and manage your news article.</p></div>
        <div className="head-actions"><button onClick={() => setPreview(true)}>Preview</button>{user?.role === "reporter" ? <button className="primary" onClick={() => save("review")}>Submit for Review</button> : canPublish && <button className="primary" onClick={() => save("publish")}>Publish</button>}</div>
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="editor-layout">
        <div className="editor-main">
          <input className="post-title" placeholder="Add title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label className="summary-label">News Summary <span>(संक्षिप्त 3-4 वाक्य)</span><textarea className="summary" placeholder="अखबार के लिए संक्षिप्त सार..." value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></label>
          <RichEditor value={form.content} onChange={(content) => setForm({ ...form, content })} />
        </div>
        <aside className="editor-side">
          <div className="side-box">
            <div className="side-title">Publish <span>⌃</span></div>
            <div className="publish-status"><span>Status:</span> {edit ? "Saved" : "Draft"}</div>
            <div className="publish-status">◉ Visibility: <b>{form.visibility}</b></div>
            <div className="side-buttons"><button onClick={() => save("draft")}>Save Draft</button><button onClick={() => setPreview(true)}>Preview</button></div>
            {canPublish && <button className="primary full" onClick={() => save("publish")}>Publish</button>}
            {user?.role === "reporter" && <button className="primary full" onClick={() => save("review")}>Submit for Review</button>}
          </div>
          <div className="side-box"><div className="side-title">Categories <span>⌃</span></div><div className="category-list">{categories.map((c) => <label key={c}><input type="checkbox" checked={form.categories.includes(c)} onChange={(e) => setForm({ ...form, categories: e.target.checked ? [...form.categories, c] : form.categories.filter((x) => x !== c) })} />{c}</label>)}</div></div>
          <div className="side-box"><div className="side-title">Tags <span>⌃</span></div><input placeholder="tag1, tag2, tag3" value={form.tags.join(", ")} onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /><small>Separate tags with commas</small></div>

          <div className="side-box">
            <div className="side-title">Images <span>⌃</span></div>
            <label className="upload-btn">
              Select images
              <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseImages} hidden />
            </label>
            <small>JPG, PNG, WEBP, GIF · max 5 MB each · up to {MAX_IMAGES} images</small>

            {previews.length > 0 && (
              <>
                <div className="thumb-grid">
                  {previews.map((p, i) => (
                    <div className="thumb" key={p.url}>
                      <img src={p.url} alt={p.file.name} />
                      <button type="button" title="Remove" onClick={() => removeSelected(i)}>×</button>
                    </div>
                  ))}
                </div>
                <button type="button" className="primary full" disabled={uploading} onClick={uploadImages}>
                  {uploading ? "Uploading…" : `Upload ${previews.length} image${previews.length > 1 ? "s" : ""}`}
                </button>
              </>
            )}

            {uploadError && <div className="error-box">{uploadError}</div>}

            {form.images.length > 0 && (
              <>
                <div className="side-title uploaded-title">Uploaded ({form.images.length})</div>
                <div className="thumb-grid">
                  {form.images.map((url, i) => (
                    <div className="thumb" key={url}>
                      <img src={url} alt={`Uploaded ${i + 1}`} />
                      {i === 0 ? <span className="cover-tag">Cover</span> : <button type="button" className="make-cover" onClick={() => makeCover(url)}>Make cover</button>}
                      <button type="button" title="Remove" onClick={() => removeUploaded(url)}>×</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="side-box"><div className="side-title">Google News <span>⌃</span></div><label className="checkbox-line"><input type="checkbox" checked={form.excludeFromGoogleNews} onChange={(e) => setForm({ ...form, excludeFromGoogleNews: e.target.checked })} /> Exclude from Google News Sitemap</label></div>
        </aside>
      </div>
      {message && <div className="toast">{message}</div>}
      {preview && (
        <div className="modal-backdrop">
          <div className="preview-modal">
            <div className="modal-head"><h3>Preview</h3><button onClick={() => setPreview(false)}>×</button></div>
            <article className="article-preview">
              <div className="preview-meta">{form.categories.join(" • ") || "News"} • {user?.name}</div>
              <h1>{form.title || "Untitled Article"}</h1>
              <p className="preview-summary">{form.summary}</p>
              {form.images.length > 0 && <div className="preview-images">{form.images.map((url) => <img key={url} src={url} alt="" />)}</div>}
              <div dangerouslySetInnerHTML={{ __html: form.content || "<p>No content yet.</p>" }} />
            </article>
          </div>
        </div>
      )}
    </section>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Unexpected dashboard error" };
  }

  componentDidCatch(error) {
    console.error("Dashboard render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="loading-screen">
          <div className="error-box" style={{ maxWidth: 520 }}>
            <b>Dashboard could not render this page.</b>
            <div style={{ marginTop: 6 }}>{this.state.message}</div>
            <button className="primary" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


function GrievanceManager({ feedbackMode = false }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const canEdit = hasFullAccess(user);

  async function load() {
    try {
      const d = await api(feedbackMode ? "/grievance-feedback" : "/grievances");
      setItems(feedbackMode ? d.feedback || [] : d.grievances || []);
      setError("");
    } catch (e) {
      setError(e.message || "Unable to load records");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { setLoading(true); load(); }, [feedbackMode]);

  async function action(url, method = "POST") {
    if (method === "DELETE" && !window.confirm("Delete this record?")) return;
    try { await api(url, { method }); await load(); } catch (e) { setError(e.message || "Action failed"); }
  }

  const heads = feedbackMode ? ["Type", "Post / Grievance", "Feedback", "Submitted By", "Date", "Action"] : ["Grievance", "Area", "Vidhan Sabha", "Parishad", "Submitted By", "Status", "Date", "Actions"];
  const imgUrl = (src) => (src.startsWith("http") ? src : `${API}/api${src}`);

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h2>{feedbackMode ? "Grievance Feedback" : "Manage Grievance"}</h2>
          <p>{feedbackMode ? "Feedback sent by users on their published grievances and published news." : "Review community grievances, publish approved items or delete them."}</p>
        </div>
        <button onClick={load}>↻ Refresh</button>
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="panel table-panel">
        <table>
          <thead><tr>{heads.map((x) => <th key={x}>{x}</th>)}</tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {feedbackMode ? (
                  <>
                    <td><span className={`status ${item.type === "news" ? "published" : "pending"}`}>{item.type === "news" ? "News" : "Grievance"}</span></td>
                    <td><b>{item.grievanceTitle}</b></td>
                    <td style={{ whiteSpace: "pre-wrap" }}>{item.message}</td>
                    <td>{item.userName}</td>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                    <td>{canEdit && <button className="danger-text" onClick={() => action(`/grievance-feedback/${item.id}`, "DELETE")}>Delete</button>}</td>
                  </>
                ) : (
                  <>
                    <td>
                      <b>{item.title}</b>
                      <div className="muted">{item.description}</div>
                      {item.image && <a href={imgUrl(item.image)} target="_blank" rel="noreferrer">View image</a>}
                    </td>
                    <td>{item.areaName}</td>
                    <td>{item.vidhanSabha || "—"}</td>
                    <td>{item.parishad || "—"}</td>
                    <td>{item.authorName}</td>
                    <td><span className={`status ${item.status}`}>{item.status}</span></td>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                    <td>
                      {canEdit && (
                        <div className="row-actions">
                          {item.status !== "published" && <button className="approve" onClick={() => action(`/grievances/${item.id}/publish`)}>Publish</button>}
                          <button className="danger-text" onClick={() => action(`/grievances/${item.id}`, "DELETE")}>Delete</button>
                        </div>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
            {!loading && items.length === 0 && <tr><td colSpan={heads.length} className="muted">No records found.</td></tr>}
            {loading && <tr><td colSpan={heads.length} className="muted">Loading...</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protected />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/dashboard/users" element={<UsersPage />} />
            <Route path="/dashboard/posts" element={<PostsPage />} />
            <Route path="/dashboard/posts/add" element={<AddPost />} />
            <Route path="/dashboard/posts/edit/:id" element={<AddPost edit />} />
            <Route path="/dashboard/grievances" element={<GrievanceManager />} />
            <Route path="/dashboard/grievance-feedback" element={<GrievanceManager feedbackMode />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </BrowserRouter>,
);
