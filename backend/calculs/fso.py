import math

# ─────────────────────────────────────────────────────────────
# Coefficients α par condition atmosphérique (dB/km)
# Sources : littérature scientifique (Kruse, Carbonneau, ITU-R)
# ─────────────────────────────────────────────────────────────
ALPHA_FSO = {
    "clair":            0.1,    # visibilité > 50 km
    "pluie_legere":     6.0,    # R < 2.5 mm/h
    "pluie_moderee":    15.0,   # 2.5 < R < 25 mm/h
    "pluie_forte":      30.0,   # R > 25 mm/h
    "brouillard":       70.0,   # visibilité ~100-200 m
    "brouillard_dense": 200.0,  # visibilité < 50 m
    "neige_seche":      30.0,   # dry snow
    "neige_humide":     80.0,   # wet snow
}


def fspl_fso(distance_km: float, longueur_onde_nm: float) -> float:
    """
    Atténuation en espace libre optique (perte géométrique).
    FSPL_FSO (dB) = 20·log10(d_m) + 20·log10(4π / λ_m)
    """
    d_m = distance_km * 1000
    lambda_m = longueur_onde_nm * 1e-9
    return 20 * math.log10(d_m) + 20 * math.log10(4 * math.pi / lambda_m)


def alpha_kruse(visibilite_km: float, longueur_onde_nm: float) -> float:
    """
    Coefficient d'atténuation atmosphérique — modèle Kruse.
    alpha (dB/km) = (3.91 / V) · (λ / 550)^(-q)
    q dépend de la visibilité.
    """
    if visibilite_km > 50:
        q = 1.6
    elif visibilite_km > 6:
        q = 1.3
    else:
        q = 0.585 * (visibilite_km ** (1/3))

    return (3.91 / visibilite_km) * ((longueur_onde_nm / 550) ** (-q))


def alpha_carbonneau(taux_pluie_mm_h: float) -> float:
    """
    Coefficient d'atténuation due à la pluie pour FSO — modèle Carbonneau.
    alpha (dB/km) = 1.076 · R^0.67
    """
    return 1.076 * (taux_pluie_mm_h ** 0.67)


def calculer_fso(p):
    """Calcul complet du bilan de liaison FSO."""
    pertes_espace = fspl_fso(p.distance, p.longueur_onde)

    # Calcul de alpha selon les données disponibles
    if p.visibilite is not None:
        # Modèle Kruse (prioritaire si visibilité fournie)
        alpha = alpha_kruse(p.visibilite, p.longueur_onde)
        methode_alpha = f"Modèle Kruse (V={p.visibilite} km)"
    elif p.taux_pluie is not None and "pluie" in p.condition_atm:
        # Modèle Carbonneau si taux de pluie fourni
        alpha = alpha_carbonneau(p.taux_pluie)
        methode_alpha = f"Modèle Carbonneau (R={p.taux_pluie} mm/h)"
    else:
        # Valeur tabulée selon condition atmosphérique
        alpha = ALPHA_FSO.get(p.condition_atm, 0.1)
        methode_alpha = f"Valeur tabulée ({p.condition_atm})"

    A_atm = alpha * p.distance
    eirp = p.puissance_tx + p.gain_tx - p.pertes_cables
    p_recue = eirp + p.gain_rx - pertes_espace - A_atm - p.pertes_cables
    marge = p_recue - p.sensibilite_rx

    return {
        "systeme": "Liaison FSO (Free Space Optical)",
        "fspl": round(pertes_espace, 2),
        "eirp": round(eirp, 2),
        "alpha_dB_km": round(alpha, 2),
        "methode_alpha": methode_alpha,
        "attenuation_atm": round(A_atm, 2),
        "attenuation_climatique": round(A_atm, 2),
        "puissance_recue": round(p_recue, 2),
        "marge": round(marge, 2),
        "valide": marge > 0,
        "details": {
            "gamma_R_ou_alpha": round(alpha, 2),
            "distance": p.distance,
            "frequence_ou_lambda": p.longueur_onde,
        },
        "params": {
            "distance_km": p.distance,
            "longueur_onde_nm": p.longueur_onde,
            "puissance_tx_dbm": p.puissance_tx,
            "gain_tx_dbi": p.gain_tx,
            "gain_rx_dbi": p.gain_rx,
            "pertes_cables_db": p.pertes_cables,
            "sensibilite_rx_dbm": p.sensibilite_rx,
            "condition_atm": p.condition_atm,
            "visibilite_km": p.visibilite,
            "taux_pluie_mm_h": p.taux_pluie,
        }
    }
