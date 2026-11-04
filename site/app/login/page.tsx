"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5013";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => { if (new URLSearchParams(window.location.search).get("created") === "1") setNotice("Account created successfully. Please login with your email and password."); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const response = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to login");
      localStorage.setItem("iv_public_token", data.token);
      localStorage.setItem("iv_public_user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("iv-auth-changed"));
      router.push(new URLSearchParams(window.location.search).get("next") || "/post-news");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to login. Please try again."); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-paper dark:bg-ink"><Header /><div className="px-4 py-12"><section className="mx-auto max-w-md rounded-xl border border-line bg-white p-7 shadow-sm dark:border-white/10 dark:bg-white/5"><p className="text-sm font-bold uppercase tracking-widest text-brick dark:text-marigold">India Voice</p><h1 className="mt-2 text-3xl font-bold text-navyDeep dark:text-white">Login</h1><p className="mt-2 text-sm text-ink/60 dark:text-white/60">Login to submit a news story or grievance for review.</p><form className="mt-6 space-y-4" onSubmit={submit}><label className="block text-sm font-semibold">Email<input className="mt-1 w-full rounded-md border border-line bg-white px-3 py-3 font-normal outline-none focus:border-navy dark:border-white/15 dark:bg-ink dark:text-white" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><label className="block text-sm font-semibold">Password<input className="mt-1 w-full rounded-md border border-line bg-white px-3 py-3 font-normal outline-none focus:border-navy dark:border-white/15 dark:bg-ink dark:text-white" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>{notice && <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">{notice}</p>}{error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className="w-full rounded-md bg-navy px-4 py-3 font-semibold text-white hover:bg-navyDeep disabled:opacity-60 dark:bg-marigold dark:text-navyDeep">{busy ? "Logging in..." : "Login"}</button></form><p className="mt-5 text-sm text-ink/70 dark:text-white/70">New here? <Link className="font-bold text-brick hover:underline dark:text-marigold" href="/signup">Create an account</Link></p></section></div><Footer /></main>;
}
