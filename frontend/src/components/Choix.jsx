import { useState } from "react";

const SYSTEMES = [
  {
    id: "hertzien",
    emoji: "📡",
    titre: "Liaison Hertzienne",
    sous: "Transmission radio (RF)",
    description: "Calcul du bilan de liaison pour des ondes radio entre deux sites distants, incluant les pertes en espace libre et l'atténuation due aux précipitations.",
    specs: [
      { icon: "📶", text: "Fréquence : 1 – 40 GHz" },
      { icon: "📉", text: "FSPL (Friis) + atténuation pluie" },
      { icon: "🌧️", text: "Modèle ITU-R P.838-3" },
      { icon: "📊", text: "EIRP · P_rx · Marge système" },
    ],
    gradient: "linear-gradient(135deg, #1e3a5f, #1a6ba0)",
    accent: "#3b82f6",
    accentLight: "#dbeafe",
  },
  {
    id: "fso",
    emoji: "🔦",
    titre: "Liaison FSO",
    sous: "Free Space Optical",
    description: "Calcul du bilan optique pour une liaison laser sans fil, avec modélisation de l'atténuation atmosphérique (brouillard, pluie, neige) via les modèles Kruse et Carbonneau.",
    specs: [
      { icon: "💡", text: "λ : 850 / 1310 / 1550 nm" },
      { icon: "📉", text: "Perte géométrique optique (FSPL)" },
      { icon: "🌫️", text: "Brouillard · Pluie · Neige" },
      { icon: "🔬", text: "Modèles Kruse & Carbonneau" },
    ],
    gradient: "linear-gradient(135deg, #1a3a2f, #0d6e5c)",
    accent: "#10b981",
    accentLight: "#d1fae5",
  },
];

export default function Choix({ setSysteme, setOnglet }) {
  const [hovered, setHovered] = useState(null);

  const choisir = (id) => {
    setSysteme(id);
    setOnglet("form");
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1rem" }}>
      {/* Header section */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "#dbeafe", color: "#1e40af",
          padding: "0.3rem 1rem", borderRadius: 99,
          fontSize: "0.78rem", fontWeight: 600,
          marginBottom: "1rem", letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}>
          Étape 1 — Choix du système
        </div>
        <h2 style={{
          fontSize: "1.8rem", fontWeight: 700,
          color: "var(--navy)", marginBottom: "0.5rem",
          letterSpacing: "-0.02em",
        }}>
          Quelle technologie souhaitez-vous dimensionner ?
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem", maxWidth: 480, margin: "0 auto" }}>
          Sélectionnez le type de liaison pour accéder aux paramètres de calcul correspondants.
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap" }}>
        {SYSTEMES.map((sys) => {
          const isHovered = hovered === sys.id;
          return (
            <div
              key={sys.id}
              onMouseEnter={() => setHovered(sys.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => choisir(sys.id)}
              style={{
                width: 360,
                background: "var(--card)",
                borderRadius: 16,
                border: `2px solid ${isHovered ? sys.accent : "var(--border)"}`,
                boxShadow: isHovered ? `0 12px 40px rgba(0,0,0,0.14), 0 0 0 4px ${sys.accentLight}` : "var(--shadow-sm)",
                cursor: "pointer",
                overflow: "hidden",
                transition: "all 0.25s ease",
                transform: isHovered ? "translateY(-4px)" : "none",
              }}
            >
              {/* Card header banner */}
              <div style={{
                background: sys.gradient,
                padding: "1.5rem 1.5rem 1.2rem",
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", right: -20, top: -20,
                  width: 100, height: 100, borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                }} />
                <div style={{ fontSize: 36, marginBottom: "0.6rem" }}>{sys.emoji}</div>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                    {sys.sous}
                  </p>
                  <h3 style={{ color: "#fff", fontSize: "1.25rem", fontWeight: 700, margin: "0.2rem 0 0" }}>
                    {sys.titre}
                  </h3>
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: "1.2rem 1.5rem" }}>
                <p style={{ color: "var(--muted)", fontSize: "0.87rem", lineHeight: 1.65, marginBottom: "1.1rem" }}>
                  {sys.description}
                </p>

                <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: "1.3rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {sys.specs.map((spec, i) => (
                    <li key={i} style={{
                      display: "flex", alignItems: "center", gap: "0.6rem",
                      fontSize: "0.84rem", color: "#374151",
                    }}>
                      <span style={{
                        width: 28, height: 28,
                        background: sys.accentLight,
                        borderRadius: 6,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.85rem", flexShrink: 0,
                      }}>
                        {spec.icon}
                      </span>
                      {spec.text}
                    </li>
                  ))}
                </ul>

                <button
                  style={{
                    width: "100%",
                    padding: "0.7rem",
                    background: isHovered ? sys.accent : "transparent",
                    color: isHovered ? "#fff" : sys.accent,
                    border: `2px solid ${sys.accent}`,
                    borderRadius: 8,
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  }}
                >
                  Choisir cette technologie
                  <span style={{ fontSize: "1rem" }}>→</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info band */}
      <div style={{
        marginTop: "2rem",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "1rem 1.5rem",
        display: "flex", alignItems: "center", gap: "1rem",
        maxWidth: 760, margin: "2rem auto 0",
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>ℹ️</span>
        <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--muted)", lineHeight: 1.6 }}>
          Tous les calculs utilisent les normes <strong style={{ color: "var(--text)" }}>ITU-R P.838-3</strong> (hertzien) et
          les modèles <strong style={{ color: "var(--text)" }}>Kruse / Carbonneau</strong> (FSO).
          Les résultats incluent FSPL, EIRP, atténuation climatique, puissance reçue et marge système.
        </p>
      </div>
    </div>
  );
}
