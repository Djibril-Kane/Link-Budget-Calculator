// Grâce au proxy Vite (vite.config.js), pas besoin de l'URL complète
const BASE = "/api";

export async function calculerHertzien(params) {
  const res = await fetch(`${BASE}/hertzien`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Erreur calcul hertzien");
  return res.json();
}

export async function calculerFSO(params) {
  const res = await fetch(`${BASE}/fso`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Erreur calcul FSO");
  return res.json();
}

export async function exporterPDF(data) {
  const res = await fetch(`${BASE}/rapport`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erreur génération PDF");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rapport_bilan.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
