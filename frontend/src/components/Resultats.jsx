import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { exporterPDF } from "../api/client";

function genererCourbe(resultats) {
  // Génère l'évolution de la puissance reçue en fonction de la distance
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

export default function Resultats({ resultats }) {
  if (!resultats) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
        <p>Aucun résultat. Veuillez d'abord renseigner les paramètres et lancer le calcul.</p>
      </div>
    );
  }

  const valide = resultats.valide;
  const courbe = genererCourbe(resultats);

  const handlePDF = async () => {
    try {
      await exporterPDF({ resultats });
    } catch (e) {
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
    <div style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ color: "#1F4E79" }}>Résultats du bilan — {resultats.systeme}</h2>

      {/* Indicateur validité */}
      <div style={{
        background: valide ? "#D5F5E3" : "#FADBD8",
        border: `2px solid ${valide ? "#1E8449" : "#C0392B"}`,
        borderRadius: 10,
        padding: "1rem 1.5rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}>
        <span style={{ fontSize: 36 }}>{valide ? "✅" : "❌"}</span>
        <div>
          <strong style={{ fontSize: "1.1rem", color: valide ? "#1E8449" : "#C0392B" }}>
            Liaison {valide ? "VALIDE" : "INVALIDE"}
          </strong>
          <p style={{ margin: 0, color: "#444", fontSize: "0.9rem" }}>
            {valide
              ? `Marge système positive : ${resultats.marge} dB — la liaison est opérationnelle.`
              : `Marge système négative : ${resultats.marge} dB — signal insuffisant au récepteur.`}
          </p>
        </div>
      </div>

      {/* Tableau résultats */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2rem" }}>
        <thead>
          <tr style={{ background: "#1F4E79", color: "#fff" }}>
            <th style={{ padding: "0.6rem 1rem", textAlign: "left", fontWeight: "bold" }}>Grandeur</th>
            <th style={{ padding: "0.6rem 1rem", textAlign: "right", fontWeight: "bold" }}>Valeur</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => (
            <tr key={i} style={{ background: l.highlight ? "#D6E4F0" : i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
              <td style={{ padding: "0.5rem 1rem", color: "#333", fontSize: "0.9rem" }}>{l.label}</td>
              <td style={{ padding: "0.5rem 1rem", textAlign: "right", fontWeight: l.highlight ? "bold" : "normal", color: l.highlight ? "#1F4E79" : "#000" }}>
                {l.val}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Graphique */}
      <h3 style={{ color: "#2E75B6", marginBottom: "0.5rem" }}>
        Évolution de la puissance reçue en fonction de la distance
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={courbe} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="distance" label={{ value: "Distance (km)", position: "insideBottom", offset: -2 }} />
          <YAxis label={{ value: "dBm", angle: -90, position: "insideLeft" }} />
          <Tooltip formatter={(v, n) => [`${v} dBm`, n === "puissance_recue" ? "Puissance reçue" : "Sensibilité RX"]} />
          <Legend verticalAlign="top" />
          <Line type="monotone" dataKey="puissance_recue" stroke="#2E75B6" strokeWidth={2} dot={false} name="Puissance reçue" />
          <Line type="monotone" dataKey="sensibilite" stroke="#C0392B" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Sensibilité RX" />
        </LineChart>
      </ResponsiveContainer>

      {/* Export PDF */}
      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <button onClick={handlePDF} style={{
          background: "#1E8449", color: "#fff", border: "none",
          borderRadius: 8, padding: "0.7rem 2rem",
          fontSize: "1rem", cursor: "pointer", fontWeight: "bold",
        }}>
          📄 Exporter le rapport PDF
        </button>
      </div>
    </div>
  );
}
