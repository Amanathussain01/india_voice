"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5013";
const categories = ["क्षेत्रीय", "देश", "दुनिया", "राजनीति", "बिज़नेस", "तकनीक", "खेल", "ऑटो", "मनोरंजन", "एस्ट्रोलॉजी", "जीवन मंत्रा", "जरा हटके"];

type PublicUser = { id: string; name: string; email: string; role: string };

export default function PostNewsForm() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [areaName, setAreaName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("क्षेत्रीय");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const checkLogin = () => {
      const token = localStorage.getItem("iv_public_token");
      const saved = localStorage.getItem("iv_public_user");
      if (!token || !saved) {
        setUser(null);
        setChecking(false);
        router.replace("/login?next=/post-news");
        return;
      }
      try {
        setUser(JSON.parse(saved));
        setChecking(false);
      } catch {
        localStorage.removeItem("iv_public_token");
        localStorage.removeItem("iv_public_user");
        setUser(null);
        router.replace("/login");
      }
    };
    checkLogin();
    window.addEventListener("iv-auth-changed", checkLogin);
    window.addEventListener("storage", checkLogin);
    return () => {
      window.removeEventListener("iv-auth-changed", checkLogin);
      window.removeEventListener("storage", checkLogin);
    };
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!image) {
      setError("Please select a news image to upload.");
      return;
    }
    const token = localStorage.getItem("iv_public_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    const form = new FormData();
    form.set("areaName", areaName);
    form.set("title", title);
    form.set("description", description);
    form.set("category", category);
    form.set("image", image);
    setBusy(true);
    try {
      const response = await fetch(`${API}/api/community/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not submit news");
      setSuccess("Your news has been submitted successfully. It will appear on the website after admin approval.");
      setAreaName("");
      setTitle("");
      setDescription("");
      setCategory("क्षेत्रीय");
      setImage(null);
      const fileInput = document.getElementById("news-image") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit news. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) return <main className="min-h-screen bg-paper dark:bg-ink"><Header /><p className="mx-auto max-w-3xl px-4 py-16">Checking login...</p><Footer /></main>;
  if (!user) return <main className="min-h-screen bg-paper dark:bg-ink"><Header /><p className="mx-auto max-w-3xl px-4 py-16">Redirecting to login...</p><Footer /></main>;

  return (
    <main className="min-h-screen bg-paper dark:bg-ink">
      <Header />
      <div className="min-h-[70vh] px-4 py-10">
        <section className="mx-auto max-w-3xl rounded-xl border border-line bg-white p-5 shadow-sm sm:p-8 dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-brick dark:text-marigold">Community Contributor</p>
              <h1 className="mt-2 text-3xl font-bold text-navyDeep dark:text-white">Post News</h1>
              <p className="mt-2 text-sm text-ink/60 dark:text-white/60">Signed in as {user.name}. Every submission is reviewed by the editorial team.</p>
            </div>
            <Link href="/" className="text-sm font-semibold text-brick hover:underline dark:text-marigold">Back to website</Link>
          </div>
          <form onSubmit={submit} className="mt-7 space-y-5">
            <label className="block text-sm font-semibold">Area name / location
              <input value={areaName} onChange={event => setAreaName(event.target.value)} required maxLength={120} placeholder="e.g. Ghaziabad, Uttar Pradesh" className="mt-1 w-full rounded-md border border-line bg-white px-3 py-3 font-normal outline-none focus:border-navy dark:border-white/15 dark:bg-ink dark:text-white" />
            </label>
            <label className="block text-sm font-semibold">News title
              <input value={title} onChange={event => setTitle(event.target.value)} required minLength={5} maxLength={180} placeholder="Enter a clear headline" className="mt-1 w-full rounded-md border border-line bg-white px-3 py-3 font-normal outline-none focus:border-navy dark:border-white/15 dark:bg-ink dark:text-white" />
            </label>
            <label className="block text-sm font-semibold">Category
              <select value={category} onChange={event => setCategory(event.target.value)} className="mt-1 w-full rounded-md border border-line bg-white px-3 py-3 font-normal outline-none focus:border-navy dark:border-white/15 dark:bg-ink dark:text-white">
                {categories.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">News description
              <textarea value={description} onChange={event => setDescription(event.target.value)} required minLength={20} rows={7} maxLength={12000} placeholder="Write the full news report, including important details and context..." className="mt-1 w-full resize-y rounded-md border border-line bg-white px-3 py-3 font-normal outline-none focus:border-navy dark:border-white/15 dark:bg-ink dark:text-white" />
              <span className="mt-1 block text-right text-xs font-normal text-ink/50 dark:text-white/50">{description.length}/12000</span>
            </label>
            <label className="block text-sm font-semibold">Upload news image (JPG, PNG, WEBP or GIF; max 5 MB)
              <input id="news-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required onChange={event => setImage(event.target.files?.[0] || null)} className="mt-2 block w-full rounded-md border border-line p-3 text-sm font-normal dark:border-white/15 dark:text-white" />
            </label>
            {image && <p className="text-xs text-ink/60 dark:text-white/60">Selected: {image.name} ({Math.ceil(image.size / 1024)} KB)</p>}
            {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {success && <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">{success}</p>}
            <button disabled={busy} className="w-full rounded-md bg-navy px-5 py-3 font-semibold text-white hover:bg-navyDeep disabled:opacity-60 dark:bg-marigold dark:text-navyDeep">{busy ? "Submitting..." : "Submit News for Approval"}</button>
            <p className="text-xs leading-relaxed text-ink/50 dark:text-white/50">Your story will not appear publicly until an administrator approves it in the dashboard.</p>
          </form>
        </section>
      </div>
      <Footer />
    </main>
  );
}
