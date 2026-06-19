import { useState } from "react";
import Choix from "./components/Choix";
import Formulaire from "./components/Formulaire";
import Resultats from "./components/Resultats";

const ONGLETS = [
  { id: "choix", label: "1 — Système" },
  { id: "form",  label: "2 — Paramètres" },
  { id: "res",   label: "3 — Résultats" },
];

export default function App() {
  const [onglet, setOnglet] = useState("choix");
  const [systeme, setSysteme] = useState(null);
  const [resultats, setResultats] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "#F4F8FC", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <header style={{
        background: "#1F4E79", color: "#fff",
        padding: "1rem 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "bold" }}>
            Outil de Dimensionnement Télécoms
          </h1>
          <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.75 }}>
            Bilan de Liaison Hertzienne & FSO — ESP/UCAD DIC2 INFO / M1 GLSI
          </p>
        </div>
        {systeme && (
          <span style={{
            background: "#2E75B6", borderRadius: 20,
            padding: "0.3rem 1rem", fontSize: "0.85rem",
          }}>
            {systeme === "hertzien" ? "📡 Liaison Hertzienne" : "🔦 Liaison FSO"}
          </span>
        )}
      </header>

      {/* Navigation onglets */}
      <nav style={{
        display: "flex", background: "#fff",
        borderBottom: "2px solid #D6E4F0",
        padding: "0 2rem",
      }}>
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            style={{
              padding: "0.8rem 1.5rem",
              border: "none", background: "none",
              cursor: "pointer", fontSize: "0.9rem",
              fontWeight: onglet === o.id ? "bold" : "normal",
              color: onglet === o.id ? "#1F4E79" : "#666",
              borderBottom: onglet === o.id ? "3px solid #2E75B6" : "3px solid transparent",
              marginBottom: -2,
            }}
          >
            {o.label}
          </button>
        ))}
      </nav>

      {/* Contenu */}
      <main style={{ padding: "1rem" }}>
        {onglet === "choix" && (
          <Choix setSysteme={setSysteme} setOnglet={setOnglet} />
        )}
        {onglet === "form" && (
          <Formulaire
            systeme={systeme}
            setResultats={setResultats}
            setOnglet={setOnglet}
          />
        )}
        {onglet === "res" && (
          <Resultats resultats={resultats} />
        )}
      </main>
    </div>
  );
}
