"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5013";
type G = { id: string; title: string; areaName: string; description: string; status: string; createdAt: string; assignedReporterName?: string; vidhanSabha?: string; parishad?: string };

export default function FeedbackStatus() {
  const router = useRouter();
  const [grievances, setGrievances] = useState<G[]>([]);
  const [news, setNews] = useState<G[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const token = localStorage.getItem("iv_public_token");
    if (!token) { router.replace("/login?next=/feedback-status"); return; }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [g, n] = await Promise.all([
        fetch(`${API}/api/community/grievances/mine`, { headers }),
        fetch(`${API}/api/community/posts/mine`, { headers }),
      ]);
      const gd = await g.json(); const nd = await n.json();
      if (g.ok) setGrievances(gd.grievances || []); else setError(gd.message || "Unable to load grievances");
      if (n.ok) setNews(nd.posts || []); else setError(nd.message || "Unable to load news posts");
    } catch { setError("Server se connect nahi ho paaya."); }
  }
  useEffect(() => { load(); }, []);

  async function send(kind: "grievance" | "news", id: string) {
    setMessage(""); setError("");
    const token = localStorage.getItem("iv_public_token");
    const path = kind === "news" ? `/api/community/posts/${id}/feedback` : `/api/community/grievances/${id}/feedback`;
    const key = `${kind}:${id}`;
    const r = await fetch(`${API}${path}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ message: feedback[key] || "" }) });
    const d = await r.json();
    if (!r.ok) setError(d.message || "Could not send feedback");
    else { setMessage("Feedback submitted successfully."); setFeedback(v => ({ ...v, [key]: "" })); }
  }

  const card = (kind: "grievance" | "news", g: G) => {
    const key = `${kind}:${g.id}`;
    return (
      <article key={key} className="rounded-xl border border-line bg-white p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap justify-between gap-3">
          <h3 className="text-xl font-bold">{g.title}</h3>
          <span className="rounded-full bg-paper px-3 py-1 text-sm font-semibold dark:bg-white/10">{g.status}</span>
        </div>
        <p className="mt-1 text-sm opacity-60">{g.areaName}{kind === "grievance" && g.vidhanSabha && g.parishad ? ` · ${g.vidhanSabha} · ${g.parishad}` : ""} · {new Date(g.createdAt).toLocaleDateString()}{g.assignedReporterName ? ` · Reporter: ${g.assignedReporterName}` : ""}</p>
        <p className="mt-3 line-clamp-4 whitespace-pre-wrap">{g.description}</p>
        {g.status === "published" ? (
          <div className="mt-4 border-t pt-4">
            <label className="block text-sm font-semibold">Feedback on this {kind === "news" ? "news" : "grievance"}
              <textarea value={feedback[key] || ""} onChange={e => setFeedback(v => ({ ...v, [key]: e.target.value }))} className="mt-2 w-full rounded border p-3 font-normal dark:bg-ink" rows={3} placeholder="Share an update or feedback" />
            </label>
            <button onClick={() => send(kind, g.id)} className="mt-2 rounded bg-navy px-4 py-2 text-sm font-semibold text-white dark:bg-marigold dark:text-navyDeep">Send Feedback</button>
          </div>
        ) : <p className="mt-4 border-t pt-3 text-sm opacity-60">Feedback option will appear here once this is published.</p>}
      </article>
    );
  };

  return (
    <main className="min-h-screen bg-paper dark:bg-ink">
      <Header />
      <section className="mx-auto min-h-[65vh] max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-bold text-navyDeep dark:text-white">Feedback Status</h1>
        <p className="mt-2 opacity-70">Track your grievances and news posts, and send feedback once they are published.</p>
        {message && <p className="mt-4 text-green-700">{message}</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}
        <h2 className="mt-8 text-2xl font-bold">My News Posts</h2>
        <div className="mt-4 space-y-4">
          {news.map(p => card("news", { ...p, description: (p as any).summary || p.description || "" }))}
          {news.length === 0 && <p className="rounded border border-dashed p-8 text-center opacity-70">You have not posted any news yet.</p>}
        </div>
        <h2 className="mt-10 text-2xl font-bold">My Grievances</h2>
        <div className="mt-4 space-y-4">
          {grievances.map(g => card("grievance", g))}
          {grievances.length === 0 && <p className="rounded border border-dashed p-8 text-center opacity-70">You have not submitted any grievances yet.</p>}
        </div>
      </section>
      <Footer />
    </main>
  );
}
