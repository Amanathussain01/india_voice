"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5013";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      const response = await fetch(`${API}/api/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to create account");
      router.push("/login?created=1");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to create account. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-paper dark:bg-ink"><Header /><div className="px-4 py-12"><section className="mx-auto max-w-md rounded-xl border border-line bg-white p-7 shadow-sm dark:border-white/10 dark:bg-white/5"><p className="text-sm font-bold uppercase tracking-widest text-brick dark:text-marigold">India Voice</p><h1 className="mt-2 text-3xl font-bold text-navyDeep dark:text-white">Create your account</h1><p className="mt-2 text-sm text-ink/60 dark:text-white/60">Register as a contributor. Your submitted news will be reviewed before publication.</p><form className="mt-6 space-y-4" onSubmit={submit}><label className="block text-sm font-semibold">Full name<input className="mt-1 w-full rounded-md border border-line bg-white px-3 py-3 font-normal outline-none focus:border-navy dark:border-white/15 dark:bg-ink dark:text-white" required minLength={2} value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label><label className="block text-sm font-semibold">Email<input className="mt-1 w-full rounded-md border border-line bg-white px-3 py-3 font-normal outline-none focus:border-navy dark:border-white/15 dark:bg-ink dark:text-white" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label><label className="block text-sm font-semibold">Password<input className="mt-1 w-full rounded-md border border-line bg-white px-3 py-3 font-normal outline-none focus:border-navy dark:border-white/15 dark:bg-ink dark:text-white" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" /><span className="mt-1 block text-xs font-normal text-ink/50 dark:text-white/50">At least 8 characters.</span></label><label className="block text-sm font-semibold">Confirm password<input className="mt-1 w-full rounded-md border border-line bg-white px-3 py-3 font-normal outline-none focus:border-navy dark:border-white/15 dark:bg-ink dark:text-white" type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" /></label>{error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className="w-full rounded-md bg-navy px-4 py-3 font-semibold text-white hover:bg-navyDeep disabled:opacity-60 dark:bg-marigold dark:text-navyDeep">{busy ? "Creating account..." : "Sign up"}</button></form><p className="mt-5 text-sm text-ink/70 dark:text-white/70">Already have an account? <Link className="font-bold text-brick hover:underline dark:text-marigold" href="/login">Login</Link></p></section></div><Footer /></main>;
}
