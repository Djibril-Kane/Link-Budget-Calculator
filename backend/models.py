from pydantic import BaseModel
from typing import Optional

class ParamsHertzien(BaseModel):
    distance: float          # km
    frequence: float         # GHz
    puissance_tx: float      # dBm
    gain_tx: float           # dBi — saisie manuelle ou calculé
    gain_rx: float           # dBi — saisie manuelle ou calculé
    pertes_cables: float     # dB
    sensibilite_rx: float    # dBm
    taux_pluie: float        # mm/h
    polarisation: str = "H"  # H ou V

class ParamsFSO(BaseModel):
    distance: float              # km
    longueur_onde: float         # nm (ex: 850, 1310, 1550)
    puissance_tx: float          # dBm
    gain_tx: float               # dBi
    gain_rx: float               # dBi
    pertes_cables: float         # dB
    sensibilite_rx: float        # dBm
    condition_atm: str           # clair / pluie_legere / pluie_moderee / pluie_forte / brouillard / brouillard_dense / neige_seche / neige_humide
    visibilite: Optional[float] = None   # km — optionnel, active le modèle Kruse
    taux_pluie: Optional[float] = None  # mm/h — si condition pluie, active Carbonneau
