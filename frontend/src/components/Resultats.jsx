import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { exporterPDF } from "../api/client";

function genererCourbe(resultats) {
  const points = [];
  const systeme = resultats.systeme?.includes("FSO") ? "fso" : "hertzien";
  const params = resultats.params;
  const base_d = params.distance_km;

  for (let i = 1; i <= 20; i++) {
    const d = (base_d * i) / 10;
    let fspl, p_rx;
    if (systeme === "hertzien") {
      fspl = 20 * Math.log10(d) + 20 * Math.log10(params.frequence_ghz) + 92.45;
      const att_pluie = resultats.attenuation_pluie * (d / base_d);
      p_rx = resultats.eirp + params.gain_rx_dbi - fspl - att_pluie - params.pertes_cables_db;
    } else {
      const d_m = d * 1000;
      const lambda_m = params.longueur_onde_nm * 1e-9;
      fspl = 20 * Math.log10(d_m) + 20 * Math.log10((4 * Math.PI) / lambda_m);
      const att_atm = resultats.alpha_dB_km * d;
      p_rx = resultats.eirp + params.gain_rx_dbi - fspl - att_atm - params.pertes_cables_db;
    }
    points.push({
      distance: parseFloat(d.toFixed(2)),
      puissance_recue: parseFloat(p_rx.toFixed(2)),
      sensibilite: params.sensibilite_rx_dbm,
    });
  }
  return points;
}

function MetricCard({ label, value, unit, highlight, color }) {
  return (
    <div style={{
      background: highlight ? "linear-gradient(135deg, #1e3a5f, #1a6ba0)" : "var(--card)",
      border: `1px solid ${highlight ? "transparent" : "var(--border)"}`,
      borderRadius: 10,
      padding: "0.9rem 1.1rem",
      boxShadow: highlight ? "0 4px 16px rgba(30,58,95,0.25)" : "var(--shadow-sm)",
    }}>
      <p style={{
        margin: 0, fontSize: "0.73rem", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.06em",
        color: highlight ? "rgba(255,255,255,0.65)" : "var(--muted)",
        marginBottom: "0.3rem",
      }}>
        {label}
      </p>
      <p style={{
        margin: 0, fontSize: "1.35rem", fontWeight: 700,
        color: highlight ? "#fff" : (color || "var(--navy)"),
        lineHeight: 1.1,
      }}>
        {value}
        {unit && <span style={{ fontSize: "0.8rem", fontWeight: 500, marginLeft: 4, opacity: 0.7 }}>{unit}</span>}
      </p>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid var(--border)",
      borderRadius: 8, padding: "0.6rem 0.9rem",
      boxShadow: "var(--shadow-md)", fontSize: "0.83rem",
    }}>
      <p style={{ margin: 0, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>d = {label} km</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.color }}>
          {p.name} : {p.value} dBm
        </p>
      ))}
    </div>
  );
};

export default function Resultats({ resultats }) {
  if (!resultats) {
    return (
      <div style={{
        maxWidth: 600, margin: "4rem auto", textAlign: "center",
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 16, padding: "3rem 2rem",
        boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ fontSize: 56, marginBottom: "1rem" }}>📊</div>
        <h3 style={{ color: "var(--navy)", marginBottom: "0.5rem" }}>Aucun résultat disponible</h3>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Renseignez les paramètres dans l'onglet <strong>Paramètres</strong> et lancez le calcul.
        </p>
      </div>
    );
  }

  const valide = resultats.valide;
  const courbe = genererCourbe(resultats);

  const handlePDF = async () => {
    try {
      await exporterPDF({ resultats });
    } catch {
      alert("Erreur lors de la génération du PDF.");
    }
  };

  const lignes = [
    { label: "Atténuation espace libre (FSPL)", val: `${resultats.fspl} dB` },
    { label: "EIRP — Puissance rayonnée équivalente", val: `${resultats.eirp} dBm` },
    resultats.gamma_R_dB_km !== undefined
      ? { label: "Atténuation spécifique pluie γR", val: `${resultats.gamma_R_dB_km} dB/km` }
      : null,
    resultats.attenuation_pluie !== undefined
      ? { label: "Atténuation totale pluie", val: `${resultats.attenuation_pluie} dB` }
      : null,
    resultats.alpha_dB_km !== undefined
      ? { label: `Coefficient α atmosphérique (${resultats.methode_alpha || ""})`, val: `${resultats.alpha_dB_km} dB/km` }
      : null,
    resultats.attenuation_atm !== undefined
      ? { label: "Atténuation atmosphérique totale", val: `${resultats.attenuation_atm} dB` }
      : null,
    { label: "Puissance reçue P_rx", val: `${resultats.puissance_recue} dBm` },
    { label: "Marge système", val: `${resultats.marge} dB`, highlight: true },
  ].filter(Boolean);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "0.5rem 1rem 3rem" }}>

      {/* Page title */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--navy)", margin: 0 }}>
          Résultats du bilan — {resultats.systeme}
        </h2>
        <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.87rem" }}>
          Calcul effectué selon les normes ITU-R et modèles atmosphériques standards.
        </p>
      </div>

      {/* Validity banner */}
      <div style={{
        background: valide
          ? "linear-gradient(135deg, #064e3b, #059669)"
          : "linear-gradient(135deg, #7f1d1d, #dc2626)",
        borderRadius: 14,
        padding: "1.2rem 1.6rem",
        marginBottom: "1.5rem",
        display: "flex", alignItems: "center", gap: "1.2rem",
        boxShadow: valide
          ? "0 4px 20px rgba(16,185,129,0.3)"
          : "0 4px 20px rgba(239,68,68,0.3)",
      }}>
        <div style={{
          width: 52, height: 52,
          background: "rgba(255,255,255,0.15)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, flexShrink: 0,
        }}>
          {valide ? "✅" : "❌"}
        </div>
        <div>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Statut de la liaison
          </p>
          <p style={{ margin: "0.2rem 0 0", color: "#fff", fontSize: "1.15rem", fontWeight: 700 }}>
            Liaison {valide ? "VALIDE" : "INVALIDE"} — Marge : {resultats.marge} dB
          </p>
          <p style={{ margin: "0.2rem 0 0", color: "rgba(255,255,255,0.75)", fontSize: "0.85rem" }}>
            {valide
              ? "La marge système est positive : le signal est suffisant au récepteur."
              : "La marge système est négative : le signal est insuffisant au récepteur."}
          </p>
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <MetricCard label="FSPL" value={resultats.fspl} unit="dB" />
        <MetricCard label="EIRP" value={resultats.eirp} unit="dBm" />
        <MetricCard label="Puissance reçue" value={resultats.puissance_recue} unit="dBm" color={valide ? "#059669" : "#dc2626"} />
        <MetricCard
          label="Marge système"
          value={`${resultats.marge > 0 ? "+" : ""}${resultats.marge}`}
          unit="dB"
          highlight
        />
        {resultats.attenuation_pluie !== undefined && (
          <MetricCard label="Atténuation pluie" value={resultats.attenuation_pluie} unit="dB" />
        )}
        {resultats.attenuation_atm !== undefined && (
          <MetricCard label="Atténuation atmosphérique" value={resultats.attenuation_atm} unit="dB" />
        )}
      </div>

      {/* Detail table */}
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "1.5rem",
      }}>
        <div style={{ padding: "0.9rem 1.2rem", borderBottom: "1px solid var(--border)" }}>
          <p style={{
            margin: 0, fontSize: "0.78rem", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)",
          }}>
            Détail des grandeurs calculées
          </p>
        </div>
        <table className="results-table">
          <thead>
            <tr>
              <th>Grandeur</th>
              <th>Valeur</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i} className={l.highlight ? "row-highlight" : ""}>
                <td>{l.label}</td>
                <td style={{ fontWeight: l.highlight ? 700 : 500, fontVariantNumeric: "tabular-nums" }}>
                  {l.val}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart */}
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "1.2rem 1.4rem",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "1.5rem",
      }}>
        <div style={{ marginBottom: "1rem" }}>
          <p style={{
            margin: 0, fontSize: "0.82rem", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)",
          }}>
            Évolution de la puissance reçue vs distance
          </p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "var(--muted)" }}>
            La ligne rouge pointillée représente la sensibilité minimale du récepteur.
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={courbe} margin={{ top: 10, right: 24, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="distance"
              label={{ value: "Distance (km)", position: "insideBottom", offset: -12, fontSize: 12, fill: "#64748b" }}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
            />
            <YAxis
              label={{ value: "dBm", angle: -90, position: "insideLeft", offset: 12, fontSize: 12, fill: "#64748b" }}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              wrapperStyle={{ fontSize: "0.82rem", paddingBottom: 8 }}
              formatter={(v) => v === "puissance_recue" ? "Puissance reçue" : "Sensibilité RX"}
            />
            <ReferenceLine y={resultats.params?.sensibilite_rx_dbm} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1.5} />
            <Line
              type="monotone"
              dataKey="puissance_recue"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={false}
              name="puissance_recue"
              activeDot={{ r: 5, fill: "#2563eb" }}
            />
            <Line
              type="monotone"
              dataKey="sensibilite"
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              name="sensibilite"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Export */}
      <div style={{ textAlign: "center" }}>
        <button onClick={handlePDF} className="btn-success" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem" }}>
          📄 Exporter le rapport PDF
        </button>
      </div>
    </div>
  );
}
