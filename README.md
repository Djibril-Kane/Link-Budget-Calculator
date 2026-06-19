# Link Budget Calculator — Bilan de Liaison Hertzienne & FSO

Outil de dimensionnement télécoms développé avec **FastAPI** (backend) et **React + Vite** (frontend).  
Supporte deux types de liaisons : **Hertzienne (RF)** et **FSO (Free Space Optical)**.

---

## Prérequis

| Outil | Version minimale |
|---|---|
| Python | 3.9+ |
| Node.js | 18+ |
| npm | 9+ |

---

## Lancer le backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Le serveur démarre sur **http://localhost:8000**

> **Swagger UI (documentation interactive) :** http://localhost:8000/docs  
> **Redoc :** http://localhost:8000/redoc

### Endpoints disponibles

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/` | Sanity check — retourne un message de bienvenue |
| `POST` | `/api/hertzien` | Calcul du bilan liaison hertzienne |
| `POST` | `/api/fso` | Calcul du bilan liaison FSO |
| `POST` | `/api/rapport` | Export PDF du bilan |

---

## Lancer le frontend (React + Vite)

Dans un **second terminal** :

```bash
cd frontend
npm install
npm run dev
```

L'application démarre sur **http://localhost:5173**

> Le frontend appelle l'API sur `http://localhost:8000` — le backend doit être lancé en premier.

---

## Tester l'API manuellement

### Exemple — Liaison Hertzienne

```bash
curl -X POST http://localhost:8000/api/hertzien \
  -H "Content-Type: application/json" \
  -d '{
    "distance": 10,
    "frequence": 18,
    "p_tx": 20,
    "g_tx": 34,
    "g_rx": 34,
    "pertes": 2,
    "s_rx": -80,
    "taux_pluie": 20,
    "polarisation": "H"
  }'
```

### Exemple — Liaison FSO

```bash
curl -X POST http://localhost:8000/api/fso \
  -H "Content-Type: application/json" \
  -d '{
    "distance": 1,
    "longueur_onde": 1550,
    "p_tx": 10,
    "g_tx": 20,
    "g_rx": 20,
    "pertes": 3,
    "s_rx": -35,
    "condition_atm": "clair",
    "visibilite": null
  }'
```

Ou bien utiliser directement **http://localhost:8000/docs** pour tester via l'interface Swagger.

---

## Structure du projet

```
Link Budget Calculator/
├── backend/
│   ├── main.py              # Serveur FastAPI, routes
│   ├── models.py            # Schémas Pydantic (validation des entrées)
│   └── calculs/
│       ├── hertzien.py      # Formules ITU-R P.838-3
│       ├── fso.py           # Formules FSO (Kruse, espace libre)
│       └── rapport.py       # Génération PDF (ReportLab)
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # SPA principale — 3 onglets
│   │   ├── components/
│   │   │   ├── Choix.jsx    # Onglet 1 : choix du système
│   │   │   ├── Formulaire.jsx  # Onglet 2 : saisie des paramètres
│   │   │   └── Resultats.jsx   # Onglet 3 : résultats + graphique
│   │   └── api/
│   │       └── client.js    # Appels REST vers le backend
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## Résultats retournés

```json
{
  "fspl": 145.23,
  "eirp": 52.0,
  "attenuation_climatique": 4.8,
  "puissance_recue": -43.5,
  "marge": 36.5,
  "valide": true,
  "details": {
    "gamma_R_ou_alpha": 0.48,
    "distance": 10.0,
    "frequence_ou_lambda": 18.0
  }
}
```

`valide = true` si la marge est positive (puissance reçue > sensibilité du récepteur).

---

## Arrêter les serveurs

- Backend : `Ctrl+C` dans le terminal uvicorn  
- Frontend : `Ctrl+C` dans le terminal Vite
