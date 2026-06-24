import { useState } from "react";
import Choix from "./components/Choix";
import Formulaire from "./components/Formulaire";
import Resultats from "./components/Resultats";

const STEPS = [
  { id: "choix", num: 1, label: "Système",    icon: "⚡" },
  { id: "form",  num: 2, label: "Paramètres", icon: "⚙️" },
  { id: "res",   num: 3, label: "Résultats",  icon: "📊" },
];

export default function App() {
  const [onglet, setOnglet] = useState("choix");
  const [systeme, setSysteme] = useState(null);
  const [resultats, setResultats] = useState(null);

  const currentStep = STEPS.findIndex(s => s.id === onglet);

  const isUnlocked = (id) => {
    if (id === "choix") return true;
    if (id === "form")  return systeme !== null;
    if (id === "res")   return resultats !== null;
    return false;
  };

  const handleTabClick = (id) => {
    if (isUnlocked(id)) setOnglet(id);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header style={{
        background: "linear-gradient(135deg, #0d2137 0%, #1a4a72 60%, #1e5f9e 100%)",
        color: "#fff",
        padding: "0",
        boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", right: -60, top: -60,
          width: 220, height: 220,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", right: 80, top: 10,
          width: 120, height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
          pointerEvents: "none",
        }} />

        <div style={{ padding: "1.1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{
              width: 44, height: 44,
              background: "rgba(255,255,255,0.12)",
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}>
              📡
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.01em" }}>
                Outil de Dimensionnement Télécoms
              </h1>
              <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.6, marginTop: 2 }}>
                Bilan de liaison Hertzienne &amp; FSO — ESP/UCAD · M1 GLSI
              </p>
            </div>
          </div>

          {systeme && (
            <div style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 99,
              padding: "0.35rem 1rem",
              fontSize: "0.82rem",
              fontWeight: 600,
              backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", gap: "0.4rem",
            }}>
              {systeme === "hertzien" ? "📡" : "🔦"}
              {systeme === "hertzien" ? "Liaison Hertzienne" : "Liaison FSO"}
            </div>
          )}
        </div>

        {/* ── Step navigation ── */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          padding: "0 2rem",
          display: "flex",
          gap: 0,
        }}>
          {STEPS.map((step, idx) => {
            const active  = onglet === step.id;
            const done    = idx < currentStep;
            return (
              <button
                key={step.id}
                onClick={() => handleTabClick(step.id)}
                disabled={!isUnlocked(step.id)}
                title={!isUnlocked(step.id) ? (step.id === "form" ? "Choisissez d'abord un système" : "Lancez d'abord un calcul") : ""}
                style={{
                  display: "flex", alignItems: "center", gap: "0.55rem",
                  padding: "0.75rem 1.4rem",
                  border: "none",
                  background: "transparent",
                  color: !isUnlocked(step.id) ? "rgba(255,255,255,0.25)" : active ? "#fff" : done ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.4)",
                  cursor: isUnlocked(step.id) ? "pointer" : "not-allowed",
                  fontSize: "0.85rem",
                  fontWeight: active ? 700 : 500,
                  borderBottom: active ? "3px solid #60a5fa" : "3px solid transparent",
                  transition: "all 0.2s",
                  position: "relative",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{
                  width: 22, height: 22,
                  borderRadius: "50%",
                  background: !isUnlocked(step.id) ? "rgba(255,255,255,0.07)" : active ? "#3b82f6" : done ? "#10b981" : "rgba(255,255,255,0.12)",
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}>
                  {done ? "✓" : step.num}
                </span>
                {step.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={{ flex: 1, padding: "1.5rem 1rem" }}>
        {onglet === "choix" && (
          <div className="animate-in">
            <Choix setSysteme={setSysteme} setOnglet={setOnglet} />
          </div>
        )}
        {onglet === "form" && (
          <div className="animate-in">
            <Formulaire systeme={systeme} setResultats={setResultats} setOnglet={setOnglet} />
          </div>
        )}
        {onglet === "res" && (
          <div className="animate-in">
            <Resultats resultats={resultats} />
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        textAlign: "center",
        padding: "0.8rem",
        fontSize: "0.75rem",
        color: "var(--muted)",
        borderTop: "1px solid var(--border)",
        background: "var(--card)",
      }}>
        ESP/UCAD · Master 1 GLSI · Réseaux Télécoms &amp; Services · 2025–2026
      </footer>
    </div>
  );
}
