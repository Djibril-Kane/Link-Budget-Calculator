import { useState } from "react";
import { calculerHertzien, calculerFSO } from "../api/client";

function Champ({ label, name, value, onChange, type = "number", min, step = "any", placeholder, hint }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        step={step}
        placeholder={placeholder}
      />
      {hint && <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>{hint}</span>}
    </div>
  );
}

function SelectChamp({ label, name, value, onChange, children, hint }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select className="form-select" name={name} value={value} onChange={onChange}>
        {children}
      </select>
      {hint && <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>{hint}</span>}
    </div>
  );
}

function gainParabolique(diametre, frequence) {
  const eta = 0.55;
  const f_hz = frequence * 1e9;
  const c = 3e8;
  const G = eta * Math.pow((Math.PI * diametre * f_hz) / c, 2);
  return G > 0 ? (10 * Math.log10(G)).toFixed(2) : "";
}

const ANTENNES = [
  { modele: "Parabolique 0.3m", diametre_m: 0.3, gain_dbi: 34.0 },
  { modele: "Parabolique 0.6m", diametre_m: 0.6, gain_dbi: 34.5 },
  { modele: "Parabolique 0.9m", diametre_m: 0.9, gain_dbi: 36.0 },
  { modele: "Parabolique 1.2m", diametre_m: 1.2, gain_dbi: 38.0 },
  { modele: "Saisie manuelle",  diametre_m: null, gain_dbi: null },
];

function Section({ title, children }) {
  return (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "1.2rem 1.4rem",
      marginBottom: "1rem",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div className="section-title">{title}</div>
      {children}
    </div>
  );
}

export default function Formulaire({ systeme, setResultats, setOnglet }) {
  const [form, setForm] = useState({
    distance: "", frequence: "", longueur_onde: "1550",
    puissance_tx: "", pertes_cables: "1", sensibilite_rx: "",
    taux_pluie: "0", polarisation: "H",
    condition_atm: "clair", visibilite: "", taux_pluie_fso: "",
  });

  const [modeAntenne, setModeAntenne] = useState("manuel");
  const [antenne, setAntenne] = useState({
    tx_gain: "", rx_gain: "", tx_diam: "", rx_diam: "",
    tx_modele: ANTENNES[0].modele, rx_modele: ANTENNES[0].modele,
  });
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAntenne = (e) => {
    const updated = { ...antenne, [e.target.name]: e.target.value };
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
        gain_tx: parseFloat(gainParabolique(parseFloat(antenne.tx_diam), parseFloat(form.frequence))),
        gain_rx: parseFloat(gainParabolique(parseFloat(antenne.rx_diam), parseFloat(form.frequence))),
      };
    }
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
    } catch {
      setErreur("Erreur lors du calcul. Vérifiez les paramètres et assurez-vous que le backend est démarré.");
    }
    setChargement(false);
  };

  if (!systeme) {
    return (
      <div style={{
        maxWidth: 500, margin: "4rem auto", textAlign: "center",
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 16, padding: "3rem 2rem",
        boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ fontSize: 48, marginBottom: "1rem" }}>⚠️</div>
        <h3 style={{ color: "var(--navy)", marginBottom: "0.5rem" }}>Aucun système sélectionné</h3>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          Vous devez d'abord choisir une technologie (Hertzienne ou FSO) avant d'accéder aux paramètres.
        </p>
      </div>
    );
  }

  const isHertzien = systeme === "hertzien";

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0.5rem 1rem 2rem" }}>

      {/* Page title */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.3rem" }}>
          <span style={{
            width: 36, height: 36,
            background: isHertzien ? "#dbeafe" : "#d1fae5",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>
            {isHertzien ? "📡" : "🔦"}
          </span>
          <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "var(--navy)" }}>
            {isHertzien ? "Liaison Hertzienne" : "Liaison FSO"} — Paramètres
          </h2>
        </div>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.87rem", paddingLeft: "2.7rem" }}>
          Renseignez les paramètres de votre liaison pour obtenir le bilan complet.
        </p>
      </div>

      {/* Paramètres communs */}
      <Section title="Paramètres communs">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
          <Champ label="Distance (km)" name="distance" value={form.distance} onChange={handleChange} min="0.1" placeholder="Ex : 5" />
          <Champ label="Puissance TX (dBm)" name="puissance_tx" value={form.puissance_tx} onChange={handleChange} placeholder="Ex : 20" />
          <Champ label="Pertes câbles / connecteurs (dB)" name="pertes_cables" value={form.pertes_cables} onChange={handleChange} min="0" placeholder="Ex : 1" />
          <Champ label="Sensibilité récepteur (dBm)" name="sensibilite_rx" value={form.sensibilite_rx} onChange={handleChange} placeholder="Ex : -85" />
        </div>
      </Section>

      {/* Antennes */}
      <Section title="Antennes">
        {isHertzien ? (
          <>
            <SelectChamp
              label="Mode de saisie du gain"
              name="mode"
              value={modeAntenne}
              onChange={e => setModeAntenne(e.target.value)}
            >
              <option value="manuel">Saisie manuelle du gain (dBi)</option>
              <option value="calcul">Calculer depuis le diamètre (parabolique)</option>
              <option value="preset">Choisir un modèle d'antenne parabolique</option>
            </SelectChamp>

            {modeAntenne === "manuel" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
                <Champ label="Gain TX (dBi)" name="tx_gain" value={antenne.tx_gain} onChange={handleAntenne} placeholder="Ex : 34" />
                <Champ label="Gain RX (dBi)" name="rx_gain" value={antenne.rx_gain} onChange={handleAntenne} placeholder="Ex : 34" />
              </div>
            )}

            {modeAntenne === "calcul" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
                  <div>
                    <Champ label="Diamètre TX (m)" name="tx_diam" value={antenne.tx_diam} onChange={handleAntenne} min="0.1" step="0.1" placeholder="Ex : 0.6" />
                    {antenne.tx_gain && <p className="gain-computed">✓ Gain TX ≈ {antenne.tx_gain} dBi</p>}
                  </div>
                  <div>
                    <Champ label="Diamètre RX (m)" name="rx_diam" value={antenne.rx_diam} onChange={handleAntenne} min="0.1" step="0.1" placeholder="Ex : 0.6" />
                    {antenne.rx_gain && <p className="gain-computed">✓ Gain RX ≈ {antenne.rx_gain} dBi</p>}
                  </div>
                </div>
                <p style={{ fontSize: "0.77rem", color: "var(--muted)", marginTop: 4 }}>
                  G = 10·log₁₀(η·(π·D·f/c)²), η = 0.55
                </p>
              </>
            )}

            {modeAntenne === "preset" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
                <div>
                  <SelectChamp label="Modèle antenne TX" name="tx_modele" value={antenne.tx_modele} onChange={e => handleAntenneModele("tx", e.target.value)}>
                    {ANTENNES.map(a => <option key={a.modele} value={a.modele}>{a.modele}</option>)}
                  </SelectChamp>
                  {antenne.tx_modele === "Saisie manuelle"
                    ? <Champ label="Gain TX (dBi)" name="tx_gain" value={antenne.tx_gain} onChange={handleAntenne} />
                    : antenne.tx_gain && <p className="gain-computed">✓ Gain TX ≈ {antenne.tx_gain} dBi</p>}
                </div>
                <div>
                  <SelectChamp label="Modèle antenne RX" name="rx_modele" value={antenne.rx_modele} onChange={e => handleAntenneModele("rx", e.target.value)}>
                    {ANTENNES.map(a => <option key={a.modele} value={a.modele}>{a.modele}</option>)}
                  </SelectChamp>
                  {antenne.rx_modele === "Saisie manuelle"
                    ? <Champ label="Gain RX (dBi)" name="rx_gain" value={antenne.rx_gain} onChange={handleAntenne} />
                    : antenne.rx_gain && <p className="gain-computed">✓ Gain RX ≈ {antenne.rx_gain} dBi</p>}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "0.8rem", lineHeight: 1.55 }}>
              En FSO, le gain représente la directivité du télescope/lentille optique (fournie par le constructeur).
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
              <Champ label="Gain TX optique (dBi)" name="tx_gain" value={antenne.tx_gain} onChange={handleAntenne} placeholder="Ex : 40" />
              <Champ label="Gain RX optique (dBi)" name="rx_gain" value={antenne.rx_gain} onChange={handleAntenne} placeholder="Ex : 40" />
            </div>
          </>
        )}
      </Section>

      {/* Paramètres spécifiques */}
      <Section title={isHertzien ? "Paramètres Hertziens (RF)" : "Paramètres FSO (Optique)"}>
        {isHertzien ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <Champ
              label="Fréquence (GHz)"
              name="frequence"
              value={form.frequence}
              onChange={handleChange}
              min="1"
              placeholder="Ex : 18"
              hint="Plage : 1 – 40 GHz (ITU-R P.838-3)"
            />
            <Champ
              label="Taux de pluie (mm/h)"
              name="taux_pluie"
              value={form.taux_pluie}
              onChange={handleChange}
              min="0"
              placeholder="Ex : 10"
            />
            <SelectChamp
              label="Polarisation"
              name="polarisation"
              value={form.polarisation}
              onChange={handleChange}
            >
              <option value="H">Horizontale (H)</option>
              <option value="V">Verticale (V)</option>
            </SelectChamp>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
              <SelectChamp label="Longueur d'onde (nm)" name="longueur_onde" value={form.longueur_onde} onChange={handleChange}>
                <option value="850">850 nm</option>
                <option value="1310">1310 nm</option>
                <option value="1550">1550 nm</option>
              </SelectChamp>
              <SelectChamp label="Condition atmosphérique" name="condition_atm" value={form.condition_atm} onChange={handleChange}>
                <option value="clair">☀️ Ciel clair (α ≈ 0.1 dB/km)</option>
                <option value="pluie_legere">🌦️ Pluie légère (α ≈ 6 dB/km)</option>
                <option value="pluie_moderee">🌧️ Pluie modérée (α ≈ 15 dB/km)</option>
                <option value="pluie_forte">⛈️ Pluie forte (α ≈ 30 dB/km)</option>
                <option value="brouillard">🌫️ Brouillard (α ≈ 70 dB/km)</option>
                <option value="brouillard_dense">🌫️ Brouillard dense (α ≈ 200 dB/km)</option>
                <option value="neige_seche">❄️ Neige sèche (α ≈ 30 dB/km)</option>
                <option value="neige_humide">🌨️ Neige humide (α ≈ 80 dB/km)</option>
              </SelectChamp>
            </div>
            <Champ
              label="Visibilité (km) — optionnel"
              name="visibilite"
              value={form.visibilite}
              onChange={handleChange}
              min="0.01"
              placeholder="Ex : 0.5"
              hint="Si renseignée, active le modèle Kruse"
            />
            {form.condition_atm.includes("pluie") && (
              <Champ
                label="Taux de pluie (mm/h) — optionnel"
                name="taux_pluie_fso"
                value={form.taux_pluie_fso}
                onChange={handleChange}
                min="0"
                placeholder="Ex : 10"
                hint="Si renseigné, active le modèle Carbonneau"
              />
            )}
          </>
        )}
      </Section>

      {/* Error */}
      {erreur && (
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 8,
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          color: "#dc2626",
          fontSize: "0.88rem",
          display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          ⚠️ {erreur}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={chargement}
        className="btn-primary"
        style={{ width: "100%", justifyContent: "center", padding: "0.8rem", fontSize: "0.97rem" }}
      >
        {chargement ? (
          <>
            <span style={{
              width: 16, height: 16,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }} />
            Calcul en cours…
          </>
        ) : (
          <>Calculer le bilan de liaison →</>
        )}
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
