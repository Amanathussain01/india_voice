"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5013";
type LocationOption = { code: string; name: string };
type AreaReporter = { id: string; name: string; reporterId?: string; vidhanSabha: string; parishad: string };

export default function PostGrievanceForm() {
  const router = useRouter();
  const [states, setStates] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [assemblies, setAssemblies] = useState<LocationOption[]>([]);
  const [stateCode, setStateCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [reporters, setReporters] = useState<AreaReporter[]>([]);
  const [reporterId, setReporterId] = useState("");
  const [vidhanSabha, setVidhanSabha] = useState("");
  const [parishad, setParishad] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [statesLoading, setStatesLoading] = useState(true);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [assembliesLoading, setAssembliesLoading] = useState(false);
  const [reportersLoading, setReportersLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${API}/api/public/india/states`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load states");
        if (active) setStates(data.states || []);
      })
      .catch(error => { if (active) setErr(error instanceof Error ? error.message : "Could not load states"); })
      .finally(() => { if (active) setStatesLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const checkLogin = () => {
      if (!localStorage.getItem("iv_public_token")) router.replace("/login?next=/post-grievance");
    };
    checkLogin();
    window.addEventListener("iv-auth-changed", checkLogin);
    window.addEventListener("storage", checkLogin);
    return () => {
      window.removeEventListener("iv-auth-changed", checkLogin);
      window.removeEventListener("storage", checkLogin);
    };
  }, [router]);

  useEffect(() => {
    if (!stateCode) return;
    let active = true;
    setDistrictsLoading(true);
    setErr("");
    fetch(`${API}/api/public/india/states/${encodeURIComponent(stateCode)}/districts`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load districts");
        if (active) setDistricts(data.districts || []);
      })
      .catch(error => { if (active) setErr(error instanceof Error ? error.message : "Could not load districts"); })
      .finally(() => { if (active) setDistrictsLoading(false); });
    return () => { active = false; };
  }, [stateCode]);

  useEffect(() => {
    if (!districtCode) return;
    let active = true;
    setAssembliesLoading(true);
    setErr("");
    fetch(`${API}/api/public/india/districts/${encodeURIComponent(districtCode)}/assemblies`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load Vidhan Sabha names");
        if (active) setAssemblies(data.assemblies || []);
      })
      .catch(error => { if (active) setErr(error instanceof Error ? error.message : "Could not load Vidhan Sabha names"); })
      .finally(() => { if (active) setAssembliesLoading(false); });
    return () => { active = false; };
  }, [districtCode]);

  useEffect(() => {
    if (!state || !district || !vidhanSabha || !parishad) {
      setReporters([]);
      setReporterId("");
      setReportersLoading(false);
      return;
    }
    let active = true;
    setReportersLoading(true);
    setReporterId("");
    const params = new URLSearchParams({ state, district, vidhanSabha, parishad });
    fetch(`${API}/api/public/reporters-for-area?${params.toString()}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load reporters");
        if (active) {
          const matching = data.reporters || [];
          setReporters(matching);
          setReporterId(matching[0]?.id || "");
        }
      })
      .catch(error => { if (active) setErr(error instanceof Error ? error.message : "Could not load reporters"); })
      .finally(() => { if (active) setReportersLoading(false); });
    return () => { active = false; };
  }, [state, district, vidhanSabha, parishad]);

  function changeState(code: string) {
    const selected = states.find(item => item.code === code);
    setStateCode(code);
    setState(selected?.name || "");
    setDistricts([]);
    setAssemblies([]);
    setDistrictCode("");
    setDistrict("");
    setVidhanSabha("");
    setParishad("");
    setReporterId("");
    setReporters([]);
    setReportersLoading(false);
    setErr("");
  }

  function changeDistrict(code: string) {
    const selected = districts.find(item => item.code === code);
    setDistrictCode(code);
    setDistrict(selected?.name || "");
    setAssemblies([]);
    setVidhanSabha("");
    setParishad(selected?.name ? `${selected.name} Parishad` : "");
    setReporterId("");
    setReporters([]);
    setReportersLoading(false);
    setErr("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErr("");
    setMsg("");
    const token = localStorage.getItem("iv_public_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    const form = new FormData();
    form.set("areaName", area);
    form.set("state", state);
    form.set("district", district);
    form.set("vidhanSabha", vidhanSabha);
    form.set("parishad", parishad);
    if (reporterId) form.set("reporterId", reporterId);
    form.set("title", title);
    form.set("description", description);
    if (image) form.set("image", image);
    setBusy(true);
    try {
      const response = await fetch(`${API}/api/community/grievances`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Submission failed");
      setMsg("Your grievance was submitted. It will be visible publicly after admin approval.");
      setArea("");
      setStateCode("");
      setDistrictCode("");
      setState("");
      setDistrict("");
      setDistricts([]);
      setAssemblies([]);
      setVidhanSabha("");
      setParishad("");
      setReporters([]);
      setReporterId("");
      setReportersLoading(false);
      setTitle("");
      setDescription("");
      setImage(null);
      const fileInput = document.getElementById("grievance-image") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not submit grievance");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper dark:bg-ink">
      <Header />
      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-xl border border-line bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h1 className="text-3xl font-bold text-navyDeep dark:text-white">Post Grievance</h1>
          <p className="mt-2 text-sm opacity-70">Share a local issue for review by the India Voice team.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold">State
              <select required value={stateCode} onChange={event => changeState(event.target.value)} className="mt-1 w-full rounded border p-3 font-normal dark:bg-ink">
                <option value="">{statesLoading ? "Loading states…" : "Select State / UT"}</option>
                {states.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">District
              <select required disabled={!stateCode || districtsLoading} value={districtCode} onChange={event => changeDistrict(event.target.value)} className="mt-1 w-full rounded border p-3 font-normal disabled:opacity-50 dark:bg-ink">
                <option value="">{districtsLoading ? "Loading districts…" : districts.length ? "Select District" : stateCode ? "No districts returned" : "Select District"}</option>
                {districts.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">Area name / location
              <input required value={area} onChange={event => setArea(event.target.value)} className="mt-1 w-full rounded border p-3 font-normal dark:bg-ink" placeholder="City, area or locality" />
            </label>
            <label className="block text-sm font-semibold">Vidhan Sabha
              <select required disabled={!districtCode || assembliesLoading} value={vidhanSabha} onChange={event => { setVidhanSabha(event.target.value); setReporterId(""); setReporters([]); }} className="mt-1 w-full rounded border p-3 font-normal disabled:opacity-50 dark:bg-ink">
                <option value="">{assembliesLoading ? "Loading Vidhan Sabha…" : assemblies.length ? "Select Vidhan Sabha" : districtCode ? "No Vidhan Sabha returned" : "Select Vidhan Sabha"}</option>
                {assemblies.map((item, index) => <option key={`${item.code}-${item.name}-${index}`} value={item.name}>{item.name} Vidhan Sabha</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">Parishad
              <select required disabled={!district} value={parishad} onChange={event => { setParishad(event.target.value); setReporterId(""); setReporters([]); }} className="mt-1 w-full rounded border p-3 font-normal disabled:opacity-50 dark:bg-ink">
                <option value="">Select Parishad</option>
                {district && <option value={`${district} Parishad`}>{district} Parishad</option>}
              </select>
            </label>
            <div className="rounded border border-line p-3 text-sm dark:border-white/10">
              <span className="font-semibold">Assigned Reporter</span>
              <p className="mt-1 font-normal">{reportersLoading ? "Finding registered reporter…" : reporters[0] ? `${reporters[0].name}${reporters[0].reporterId ? ` (${reporters[0].reporterId})` : ""}` : state && district && vidhanSabha && parishad ? "No admin-added reporter found for this location" : "Select State, District, Vidhan Sabha and Parishad to find the area reporter"}</p>
              {reporters.length > 1 && <p className="mt-1 text-xs opacity-70">More than one reporter is registered for this location. The first active reporter is assigned automatically.</p>}
            </div>
            <label className="block text-sm font-semibold">Grievance title
              <input required minLength={5} value={title} onChange={event => setTitle(event.target.value)} className="mt-1 w-full rounded border p-3 font-normal dark:bg-ink" placeholder="Briefly describe the issue" />
            </label>
            <label className="block text-sm font-semibold">Grievance description
              <textarea required minLength={10} rows={7} value={description} onChange={event => setDescription(event.target.value)} className="mt-1 w-full rounded border p-3 font-normal dark:bg-ink" placeholder="Describe the problem and its impact" />
            </label>
            <label className="block text-sm font-semibold">Upload supporting image (optional)
              <input id="grievance-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event => setImage(event.target.files?.[0] || null)} className="mt-2 block w-full rounded border p-3 font-normal" />
            </label>
            {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
            {msg && <p role="status" className="text-sm text-green-700">{msg}</p>}
            <button disabled={busy || statesLoading || reportersLoading || states.length === 0} className="rounded bg-navy px-5 py-3 font-semibold text-white disabled:opacity-50 dark:bg-marigold dark:text-navyDeep">{busy ? "Submitting…" : "Submit Grievance"}</button>
          </form>
        </div>
      </section>
      <Footer />
    </main>
  );
}
