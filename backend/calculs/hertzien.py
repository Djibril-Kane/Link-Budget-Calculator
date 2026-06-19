import math

# ─────────────────────────────────────────────────────────────
# Table 5 — ITU-R P.838-3 (valeurs officielles)
# Format : frequence_GHz: (kH, alphaH, kV, alphaV)
# Source : https://www.itu.int/dms_pubrec/itu-r/rec/p/r-rec-p.838-3-200503-i!!pdf-e.pdf
# ─────────────────────────────────────────────────────────────
ITU_R_P838_3 = {
    1:  (0.0000259, 0.9691, 0.0000308, 0.8592),
    2:  (0.0000847, 1.0664, 0.0000998, 0.9490),
    4:  (0.0001071, 1.6009, 0.0002461, 1.2476),
    6:  (0.0007056, 1.5900, 0.0004878, 1.5728),
    7:  (0.001915,  1.4810, 0.001425,  1.4745),
    8:  (0.004115,  1.3905, 0.003450,  1.3797),
    10: (0.01217,   1.2571, 0.01129,   1.2156),
    11: (0.01772,   1.2140, 0.01731,   1.1617),
    12: (0.02386,   1.1825, 0.02455,   1.1216),
    15: (0.04481,   1.1233, 0.05008,   1.0440),
    20: (0.09164,   1.0568, 0.09611,   0.9847),
    25: (0.1571,    0.9991, 0.1533,    0.9491),
    28: (0.2051,    0.9679, 0.1964,    0.9277),
    30: (0.2403,    0.9485, 0.2291,    0.9129),
    35: (0.3374,    0.9047, 0.3224,    0.8761),
    40: (0.4431,    0.8673, 0.4274,    0.8421),
}

def interpoler_coefficients(frequence: float, polarisation: str):
    """
    Interpole k et alpha depuis la Table 5 ITU-R P.838-3.
    - Échelle log pour k
    - Échelle linéaire pour alpha
    """
    freqs = sorted(ITU_R_P838_3.keys())

    # Bornes exactes
    if frequence in ITU_R_P838_3:
        kH, aH, kV, aV = ITU_R_P838_3[frequence]
        return (kH, aH) if polarisation == "H" else (kV, aV)

    # Clamp aux bornes
    if frequence <= freqs[0]:
        kH, aH, kV, aV = ITU_R_P838_3[freqs[0]]
        return (kH, aH) if polarisation == "H" else (kV, aV)
    if frequence >= freqs[-1]:
        kH, aH, kV, aV = ITU_R_P838_3[freqs[-1]]
        return (kH, aH) if polarisation == "H" else (kV, aV)

    # Interpolation
    f_low = max(f for f in freqs if f < frequence)
    f_high = min(f for f in freqs if f > frequence)
    kH_l, aH_l, kV_l, aV_l = ITU_R_P838_3[f_low]
    kH_h, aH_h, kV_h, aV_h = ITU_R_P838_3[f_high]

    # log-log pour k, linéaire pour alpha
    t = (math.log10(frequence) - math.log10(f_low)) / (math.log10(f_high) - math.log10(f_low))

    if polarisation == "H":
        k = 10 ** (math.log10(kH_l) + t * (math.log10(kH_h) - math.log10(kH_l)))
        alpha = aH_l + t * (aH_h - aH_l)
    else:
        k = 10 ** (math.log10(kV_l) + t * (math.log10(kV_h) - math.log10(kV_l)))
        alpha = aV_l + t * (aV_h - aV_l)

    return k, alpha


def fspl(distance_km: float, frequence_ghz: float) -> float:
    """Atténuation en espace libre — formule de Friis."""
    return 20 * math.log10(distance_km) + 20 * math.log10(frequence_ghz) + 92.45


def attenuation_pluie(frequence: float, taux_pluie: float, distance: float, polarisation: str) -> float:
    """
    Atténuation due à la pluie — ITU-R P.838-3.
    gamma_R (dB/km) = k · R^alpha
    A_pluie (dB) = gamma_R · d
    """
    k, alpha = interpoler_coefficients(frequence, polarisation)
    gamma_R = k * (taux_pluie ** alpha)
    return round(gamma_R * distance, 2), round(gamma_R, 2)


def gain_antenne_parabolique(diametre_m: float, frequence_ghz: float) -> float:
    """
    Calcule le gain d'une antenne parabolique.
    G (dBi) = 10·log10(η · (π·D·f/c)²)
    avec η = 0.55, f en Hz, c = 3e8 m/s
    """
    eta = 0.55
    f_hz = frequence_ghz * 1e9
    c = 3e8
    G = eta * (math.pi * diametre_m * f_hz / c) ** 2
    return round(10 * math.log10(G), 2)


def calculer_hertzien(p):
    """Calcul complet du bilan de liaison hertzienne."""
    pertes_espace = fspl(p.distance, p.frequence)
    A_pluie, gamma_R = attenuation_pluie(p.frequence, p.taux_pluie, p.distance, p.polarisation)
    eirp = p.puissance_tx + p.gain_tx - p.pertes_cables
    p_recue = eirp + p.gain_rx - pertes_espace - A_pluie - p.pertes_cables
    marge = p_recue - p.sensibilite_rx

    return {
        "systeme": "Liaison Hertzienne (RF)",
        "fspl": round(pertes_espace, 2),
        "eirp": round(eirp, 2),
        "gamma_R_dB_km": gamma_R,
        "attenuation_pluie": round(A_pluie, 2),
        "attenuation_climatique": round(A_pluie, 2),
        "puissance_recue": round(p_recue, 2),
        "marge": round(marge, 2),
        "valide": marge > 0,
        "details": {
            "gamma_R_ou_alpha": gamma_R,
            "distance": p.distance,
            "frequence_ou_lambda": p.frequence,
        },
        "params": {
            "distance_km": p.distance,
            "frequence_ghz": p.frequence,
            "puissance_tx_dbm": p.puissance_tx,
            "gain_tx_dbi": p.gain_tx,
            "gain_rx_dbi": p.gain_rx,
            "pertes_cables_db": p.pertes_cables,
            "sensibilite_rx_dbm": p.sensibilite_rx,
            "taux_pluie_mm_h": p.taux_pluie,
            "polarisation": p.polarisation,
        }
    }
