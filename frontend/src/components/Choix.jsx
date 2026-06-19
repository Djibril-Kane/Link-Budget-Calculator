export default function Choix({ setSysteme, setOnglet }) {
  const choisir = (sys) => {
    setSysteme(sys);
    setOnglet("form");
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.titre}>Choisissez votre système de liaison</h2>
      <p style={styles.sous}>Sélectionnez la technologie à dimensionner</p>

      <div style={styles.cards}>
        {/* Hertzien */}
        <div style={styles.card} onClick={() => choisir("hertzien")}>
          <div style={{ fontSize: 48 }}>📡</div>
          <h3 style={styles.cardTitre}>Liaison Hertzienne</h3>
          <p style={styles.cardTexte}>
            Transmission radio (RF) entre deux sites via des ondes hertziennes.
            Calcul basé sur la formule de Friis et le modèle ITU-R P.838-3
            pour l'atténuation due à la pluie.
          </p>
          <ul style={styles.cardList}>
            <li>Fréquence : 1 – 40 GHz</li>
            <li>Atténuation espace libre (FSPL)</li>
            <li>Atténuation pluie (ITU-R P.838-3)</li>
            <li>Bilan : EIRP, P_rx, Marge système</li>
          </ul>
          <button style={styles.btn}>Sélectionner →</button>
        </div>

        {/* FSO */}
        <div style={styles.card} onClick={() => choisir("fso")}>
          <div style={{ fontSize: 48 }}>🔦</div>
          <h3 style={styles.cardTitre}>Liaison FSO</h3>
          <p style={styles.cardTexte}>
            Transmission optique sans fil (Free Space Optical) par faisceau laser.
            Calcul de l'atténuation atmosphérique via les modèles Kruse et Carbonneau.
          </p>
          <ul style={styles.cardList}>
            <li>Longueur d'onde : 850 / 1310 / 1550 nm</li>
            <li>Atténuation espace libre optique</li>
            <li>Atténuation : brouillard, pluie, neige</li>
            <li>Modèles Kruse & Carbonneau</li>
          </ul>
          <button style={styles.btn}>Sélectionner →</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: 900,
    margin: "0 auto",
    textAlign: "center",
  },
  titre: {
    fontSize: "1.6rem",
    color: "#1F4E79",
    marginBottom: "0.5rem",
  },
  sous: {
    color: "#666",
    marginBottom: "2rem",
  },
  cards: {
    display: "flex",
    gap: "2rem",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  card: {
    background: "#fff",
    border: "2px solid #D6E4F0",
    borderRadius: 12,
    padding: "1.5rem",
    width: 340,
    cursor: "pointer",
    textAlign: "left",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  cardTitre: {
    color: "#1F4E79",
    margin: "0.5rem 0",
    fontSize: "1.2rem",
  },
  cardTexte: {
    color: "#444",
    fontSize: "0.9rem",
    lineHeight: 1.5,
    marginBottom: "0.8rem",
  },
  cardList: {
    color: "#555",
    fontSize: "0.85rem",
    paddingLeft: "1.2rem",
    marginBottom: "1rem",
  },
  btn: {
    background: "#2E75B6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "0.5rem 1.2rem",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.9rem",
  },
};
