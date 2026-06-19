import { useState } from "react";
import { calculerHertzien, calculerFSO } from "../api/client";

const champStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  marginBottom: "1rem",
};
const labelStyle = { fontSize: "0.85rem", color: "#1F4E79", fontWeight: "bold" };
const inputStyle = {
  padding: "0.45rem 0.7rem",
  borderRadius: 6,
  border: "1.5px solid #D6E4F0",
  fontSize: "0.95rem",
  outline: "none",
};
const selectStyle = { ...inputStyle };

function Champ({ label, name, value, onChange, type = "number", min, step = "any", placeholder }) {
  return (
    <div style={champStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        step={step}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

// Calcul du gain antenne parabolique
function gainParabolique(diametre, frequence) {
  const eta = 0.55;
  const f_hz = frequence * 1e9;
  const c = 3e8;
  const G = eta * Math.pow((Math.PI * diametre * f_hz) / c, 2);
  return G > 0 ? (10 * Math.log10(G)).toFixed(2) : "";
}

// Modèles d'antennes paraboliques génériques (cf. CLAUDE.md)
const ANTENNES = [
  { modele: "Parabolique 0.3m", diametre_m: 0.3, frequence_ghz: 18, gain_dbi: 34.0 },
  { modele: "Parabolique 0.6m", diametre_m: 0.6, frequence_ghz: 11, gain_dbi: 34.5 },
  { modele: "Parabolique 0.9m", diametre_m: 0.9, frequence_ghz: 7,  gain_dbi: 36.0 },
  { modele: "Parabolique 1.2m", diametre_m: 1.2, frequence_ghz: 6,  gain_dbi: 38.0 },
  { modele: "Saisie manuelle",  diametre_m: null, frequence_ghz: null, gain_dbi: null },
];

export default function Formulaire({ systeme, setResultats, setOnglet }) {
  const [form, setForm] = useState({
    distance: "", frequence: "", longueur_onde: "1550",
    puissance_tx: "", pertes_cables: "1", sensibilite_rx: "",
    taux_pluie: "0", polarisation: "H",
    condition_atm: "clair", visibilite: "", taux_pluie_fso: "",
  });

  const [modeAntenne, setModeAntenne] = useState("manuel"); // manuel | calcul | preset
  const [antenne, setAntenne] = useState({
    tx_gain: "", rx_gain: "", tx_diam: "", rx_diam: "",
    tx_modele: ANTENNES[0].modele, rx_modele: ANTENNES[0].modele,
  });
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleAntenne = (e) => {
    const updated = { ...antenne, [e.target.name]: e.target.value };
    // recalcul auto des gains si mode calcul
    if (modeAntenne === "calcul" && form.frequence) {
      if (e.target.name === "tx_diam")
        updated.tx_gain = gainParabolique(parseFloat(e.target.value), parseFloat(form.frequence));
      if (e.target.name === "rx_diam")
        updated.rx_gain = gainParabolique(parseFloat(e.target.value), parseFloat(form.frequence));
    }
    setAntenne(updated);
  };

  const handleAntenneModele = (cote, modele) => {
    const preset = ANTENNES.find(a => a.modele === modele);
    setAntenne(prev => ({
      ...prev,
      [`${cote}_modele`]: modele,
      [`${cote}_gain`]: preset && preset.gain_dbi !== null ? preset.gain_dbi : "",
    }));
  };

  const getGains = () => {
    if (modeAntenne === "calcul") {
      return {
        gain_tx: parseFloat(gainParabolique(parseFloat(antenne.tx_diam), parseFloat(form.frequence || form.longueur_onde))),
        gain_rx: parseFloat(gainParabolique(parseFloat(antenne.rx_diam), parseFloat(form.frequence || form.longueur_onde))),
      };
    }
    // manuel ou preset : le gain est déjà renseigné dans antenne.tx_gain / rx_gain
    return { gain_tx: parseFloat(antenne.tx_gain), gain_rx: parseFloat(antenne.rx_gain) };
  };

  const handleSubmit = async () => {
    setErreur("");
    setChargement(true);
    try {
      const { gain_tx, gain_rx } = getGains();
      let res;
      if (systeme === "hertzien") {
        res = await calculerHertzien({
          distance: parseFloat(form.distance),
          frequence: parseFloat(form.frequence),
          puissance_tx: parseFloat(form.puissance_tx),
          gain_tx, gain_rx,
          pertes_cables: parseFloat(form.pertes_cables),
          sensibilite_rx: parseFloat(form.sensibilite_rx),
          taux_pluie: parseFloat(form.taux_pluie),
          polarisation: form.polarisation,
        });
      } else {
        res = await calculerFSO({
          distance: parseFloat(form.distance),
          longueur_onde: parseFloat(form.longueur_onde),
          puissance_tx: parseFloat(form.puissance_tx),
          gain_tx, gain_rx,
          pertes_cables: parseFloat(form.pertes_cables),
          sensibilite_rx: parseFloat(form.sensibilite_rx),
          condition_atm: form.condition_atm,
          visibilite: form.visibilite ? parseFloat(form.visibilite) : null,
          taux_pluie: form.taux_pluie_fso ? parseFloat(form.taux_pluie_fso) : null,
        });
      }
      setResultats(res);
      setOnglet("res");
    } catch (e) {
      setErreur("Erreur lors du calcul. Vérifiez les paramètres et que le backend est démarré.");
    }
    setChargement(false);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{ color: "#1F4E79", marginBottom: "0.3rem" }}>
        {systeme === "hertzien" ? "📡 Liaison Hertzienne" : "🔦 Liaison FSO"} — Paramètres
      </h2>
      <p style={{ color: "#666", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
        Renseignez les paramètres de votre liaison.
      </p>

      {/* Paramètres communs */}
      <h4 style={{ color: "#2E75B6", borderBottom: "1px solid #D6E4F0", paddingBottom: 4 }}>
        Paramètres communs
      </h4>
      <Champ label="Distance (km)" name="distance" value={form.distance} onChange={handleChange} min="0.1" />
      <Champ label="Puissance d'émission TX (dBm)" name="puissance_tx" value={form.puissance_tx} onChange={handleChange} />
      <Champ label="Pertes câbles / connecteurs (dB)" name="pertes_cables" value={form.pertes_cables} onChange={handleChange} min="0" />
      <Champ label="Sensibilité récepteur (dBm)" name="sensibilite_rx" value={form.sensibilite_rx} onChange={handleChange} />

      {/* Antennes */}
      <h4 style={{ color: "#2E75B6", borderBottom: "1px solid #D6E4F0", paddingBottom: 4, marginTop: "1rem" }}>
        Antennes
      </h4>
      <div style={champStyle}>
        <label style={labelStyle}>Mode de saisie du gain</label>
        <select style={selectStyle} value={modeAntenne} onChange={e => setModeAntenne(e.target.value)}>
          <option value="manuel">Saisie manuelle du gain (dBi)</option>
          <option value="calcul">Calculer depuis le diamètre (antenne parabolique)</option>
          <option value="preset">Choisir un modèle d'antenne parabolique</option>
        </select>
      </div>

      {modeAntenne === "manuel" && (
        <>
          <Champ label="Gain antenne TX (dBi)" name="tx_gain" value={antenne.tx_gain} onChange={handleAntenne} />
          <Champ label="Gain antenne RX (dBi)" name="rx_gain" value={antenne.rx_gain} onChange={handleAntenne} />
        </>
      )}

      {modeAntenne === "calcul" && (
        <>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <Champ label="Diamètre antenne TX (m)" name="tx_diam" value={antenne.tx_diam} onChange={handleAntenne} min="0.1" step="0.1" />
              {antenne.tx_gain && <p style={{ fontSize: "0.8rem", color: "#1E8449", marginTop: -10 }}>→ Gain TX ≈ {antenne.tx_gain} dBi</p>}
            </div>
            <div style={{ flex: 1 }}>
              <Champ label="Diamètre antenne RX (m)" name="rx_diam" value={antenne.rx_diam} onChange={handleAntenne} min="0.1" step="0.1" />
              {antenne.rx_gain && <p style={{ fontSize: "0.8rem", color: "#1E8449", marginTop: -10 }}>→ Gain RX ≈ {antenne.rx_gain} dBi</p>}
            </div>
          </div>
          <p style={{ fontSize: "0.8rem", color: "#888", marginTop: -8 }}>
            Formule : G = 10·log₁₀(η·(π·D·f/c)²), η=0.55
          </p>
        </>
      )}

      {modeAntenne === "preset" && (
        <>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <div style={champStyle}>
                <label style={labelStyle}>Modèle antenne TX</label>
                <select style={selectStyle} value={antenne.tx_modele} onChange={e => handleAntenneModele("tx", e.target.value)}>
                  {ANTENNES.map(a => <option key={a.modele} value={a.modele}>{a.modele}</option>)}
                </select>
              </div>
              {antenne.tx_modele === "Saisie manuelle" ? (
                <Champ label="Gain antenne TX (dBi)" name="tx_gain" value={antenne.tx_gain} onChange={handleAntenne} />
              ) : (
                <p style={{ fontSize: "0.8rem", color: "#1E8449", marginTop: -10 }}>→ Gain TX ≈ {antenne.tx_gain} dBi</p>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={champStyle}>
                <label style={labelStyle}>Modèle antenne RX</label>
                <select style={selectStyle} value={antenne.rx_modele} onChange={e => handleAntenneModele("rx", e.target.value)}>
                  {ANTENNES.map(a => <option key={a.modele} value={a.modele}>{a.modele}</option>)}
                </select>
              </div>
              {antenne.rx_modele === "Saisie manuelle" ? (
                <Champ label="Gain antenne RX (dBi)" name="rx_gain" value={antenne.rx_gain} onChange={handleAntenne} />
              ) : (
                <p style={{ fontSize: "0.8rem", color: "#1E8449", marginTop: -10 }}>→ Gain RX ≈ {antenne.rx_gain} dBi</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Paramètres spécifiques */}
      <h4 style={{ color: "#2E75B6", borderBottom: "1px solid #D6E4F0", paddingBottom: 4, marginTop: "1rem" }}>
        {systeme === "hertzien" ? "Paramètres Hertziens" : "Paramètres FSO"}
      </h4>

      {systeme === "hertzien" ? (
        <>
          <Champ label="Fréquence (GHz)" name="frequence" value={form.frequence} onChange={handleChange} min="1" />
          <Champ label="Taux de pluie (mm/h)" name="taux_pluie" value={form.taux_pluie} onChange={handleChange} min="0" />
          <div style={champStyle}>
            <label style={labelStyle}>Polarisation</label>
            <select name="polarisation" value={form.polarisation} onChange={handleChange} style={selectStyle}>
              <option value="H">Horizontale (H)</option>
              <option value="V">Verticale (V)</option>
            </select>
          </div>
        </>
      ) : (
        <>
          <div style={champStyle}>
            <label style={labelStyle}>Longueur d'onde (nm)</label>
            <select name="longueur_onde" value={form.longueur_onde} onChange={handleChange} style={selectStyle}>
              <option value="850">850 nm</option>
              <option value="1310">1310 nm</option>
              <option value="1550">1550 nm</option>
            </select>
          </div>
          <div style={champStyle}>
            <label style={labelStyle}>Condition atmosphérique</label>
            <select name="condition_atm" value={form.condition_atm} onChange={handleChange} style={selectStyle}>
              <option value="clair">Ciel clair (α ≈ 0.1 dB/km)</option>
              <option value="pluie_legere">Pluie légère (α ≈ 6 dB/km)</option>
              <option value="pluie_moderee">Pluie modérée (α ≈ 15 dB/km)</option>
              <option value="pluie_forte">Pluie forte (α ≈ 30 dB/km)</option>
              <option value="brouillard">Brouillard (α ≈ 70 dB/km)</option>
              <option value="brouillard_dense">Brouillard dense (α ≈ 200 dB/km)</option>
              <option value="neige_seche">Neige sèche (α ≈ 30 dB/km)</option>
              <option value="neige_humide">Neige humide (α ≈ 80 dB/km)</option>
            </select>
          </div>
          <Champ label="Visibilité (km) — optionnel, active le modèle Kruse" name="visibilite" value={form.visibilite} onChange={handleChange} min="0.01" placeholder="Ex: 0.5" />
          {form.condition_atm.includes("pluie") && (
            <Champ label="Taux de pluie (mm/h) — optionnel, active le modèle Carbonneau" name="taux_pluie_fso" value={form.taux_pluie_fso} onChange={handleChange} min="0" placeholder="Ex: 10" />
          )}
        </>
      )}

      {erreur && <p style={{ color: "#C0392B", fontSize: "0.9rem" }}>{erreur}</p>}

      <button onClick={handleSubmit} disabled={chargement} style={{
        marginTop: "1rem",
        background: chargement ? "#aaa" : "#1F4E79",
        color: "#fff", border: "none", borderRadius: 8,
        padding: "0.7rem 2rem", fontSize: "1rem",
        cursor: chargement ? "not-allowed" : "pointer", fontWeight: "bold",
      }}>
        {chargement ? "Calcul en cours..." : "Calculer le bilan →"}
      </button>
    </div>
  );
}
