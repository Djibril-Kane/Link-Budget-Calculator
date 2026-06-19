from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from models import ParamsHertzien, ParamsFSO
from calculs.hertzien import calculer_hertzien
from calculs.fso import calculer_fso
from calculs.rapport import generer_pdf

app = FastAPI(title="Outil de Dimensionnement Télécoms")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API Dimensionnement Télécoms — Hertzien & FSO"}

@app.post("/api/hertzien")
def bilan_hertzien(params: ParamsHertzien):
    return calculer_hertzien(params)

@app.post("/api/fso")
def bilan_fso(params: ParamsFSO):
    return calculer_fso(params)

@app.post("/api/rapport")
def export_rapport(data: dict):
    pdf_bytes = generer_pdf(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=rapport_bilan.pdf"}
    )
