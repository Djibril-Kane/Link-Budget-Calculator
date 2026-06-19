from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime
import io

BLUE_DARK  = colors.HexColor("#1F4E79")
BLUE_MID   = colors.HexColor("#2E75B6")
BLUE_LIGHT = colors.HexColor("#D6E4F0")
GREEN      = colors.HexColor("#1E8449")
RED        = colors.HexColor("#C0392B")
GRAY       = colors.HexColor("#555555")


def generer_pdf(data: dict) -> bytes:
    """Génère un rapport PDF du bilan de liaison."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    titre_style = ParagraphStyle("titre", fontSize=18, textColor=BLUE_DARK,
                                  spaceAfter=6, alignment=TA_CENTER, fontName="Helvetica-Bold")
    sous_titre_style = ParagraphStyle("sous_titre", fontSize=12, textColor=GRAY,
                                       spaceAfter=12, alignment=TA_CENTER)
    section_style = ParagraphStyle("section", fontSize=13, textColor=BLUE_MID,
                                    spaceBefore=14, spaceAfter=6, fontName="Helvetica-Bold")
    body_style = ParagraphStyle("body", fontSize=10, textColor=colors.black,
                                 spaceAfter=4, leading=14)

    resultats = data.get("resultats", {})
    params    = resultats.get("params", {})
    systeme   = resultats.get("systeme", "—")
    valide    = resultats.get("valide", False)
    marge     = resultats.get("marge", 0)
    now       = datetime.now().strftime("%d/%m/%Y à %H:%M")

    elements = []

    # ── Titre ──
    elements.append(Spacer(1, 0.3*cm))
    elements.append(Paragraph("Rapport de Bilan de Liaison", titre_style))
    elements.append(Paragraph(f"{systeme}", sous_titre_style))
    elements.append(Paragraph(f"Généré le {now}", sous_titre_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=BLUE_MID, spaceAfter=10))

    # ── Conclusion rapide ──
    if valide:
        concl_text = f"✔ Liaison VALIDE — Marge système : {marge} dB"
        concl_color = GREEN
    else:
        concl_text = f"✘ Liaison INVALIDE — Marge système : {marge} dB (insuffisante)"
        concl_color = RED

    concl_style = ParagraphStyle("concl", fontSize=12, textColor=concl_color,
                                  spaceAfter=12, alignment=TA_CENTER, fontName="Helvetica-Bold")
    elements.append(Paragraph(concl_text, concl_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=BLUE_LIGHT, spaceAfter=10))

    # ── Paramètres saisis ──
    elements.append(Paragraph("Paramètres saisis", section_style))
    param_rows = [["Paramètre", "Valeur"]]
    labels = {
        "distance_km": "Distance (km)",
        "frequence_ghz": "Fréquence (GHz)",
        "longueur_onde_nm": "Longueur d'onde (nm)",
        "puissance_tx_dbm": "Puissance TX (dBm)",
        "gain_tx_dbi": "Gain antenne TX (dBi)",
        "gain_rx_dbi": "Gain antenne RX (dBi)",
        "pertes_cables_db": "Pertes câbles (dB)",
        "sensibilite_rx_dbm": "Sensibilité RX (dBm)",
        "taux_pluie_mm_h": "Taux de pluie (mm/h)",
        "polarisation": "Polarisation",
        "condition_atm": "Condition atmosphérique",
        "visibilite_km": "Visibilité (km)",
    }
    for key, label in labels.items():
        val = params.get(key)
        if val is not None:
            param_rows.append([label, str(val)])

    t_params = Table(param_rows, colWidths=[9*cm, 7*cm])
    t_params.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  BLUE_DARK),
        ("TEXTCOLOR",    (0, 0), (-1, 0),  colors.white),
        ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, -1), 10),
        ("BACKGROUND",   (0, 1), (-1, -1), colors.white),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, BLUE_LIGHT]),
        ("GRID",         (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING",   (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
    ]))
    elements.append(t_params)
    elements.append(Spacer(1, 0.4*cm))

    # ── Résultats calculés ──
    elements.append(Paragraph("Résultats calculés", section_style))
    res_rows = [["Grandeur", "Valeur (dB / dBm)"]]
    res_labels = {
        "fspl": "Atténuation espace libre FSPL (dB)",
        "eirp": "EIRP — Puissance rayonnée équivalente (dBm)",
        "gamma_R_dB_km": "Atténuation spécifique pluie γR (dB/km)",
        "attenuation_pluie": "Atténuation totale pluie (dB)",
        "alpha_dB_km": "Coefficient α atmosphérique (dB/km)",
        "attenuation_atm": "Atténuation atmosphérique totale (dB)",
        "puissance_recue": "Puissance reçue P_rx (dBm)",
        "marge": "Marge système (dB)",
    }
    for key, label in res_labels.items():
        val = resultats.get(key)
        if val is not None:
            res_rows.append([label, str(val)])

    t_res = Table(res_rows, colWidths=[12*cm, 4*cm])
    t_res.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  BLUE_MID),
        ("TEXTCOLOR",    (0, 0), (-1, 0),  colors.white),
        ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, BLUE_LIGHT]),
        ("GRID",         (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING",   (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
    ]))
    elements.append(t_res)
    elements.append(Spacer(1, 0.4*cm))

    # ── Conclusion ──
    elements.append(HRFlowable(width="100%", thickness=1, color=BLUE_MID, spaceAfter=8))
    elements.append(Paragraph("Conclusion", section_style))
    if valide:
        concl = (f"La liaison {systeme} est <b>valide</b>. "
                 f"La puissance reçue ({resultats.get('puissance_recue')} dBm) est supérieure "
                 f"à la sensibilité du récepteur ({params.get('sensibilite_rx_dbm')} dBm), "
                 f"avec une marge système de <b>{marge} dB</b>.")
    else:
        concl = (f"La liaison {systeme} est <b>invalide</b>. "
                 f"La puissance reçue ({resultats.get('puissance_recue')} dBm) est insuffisante "
                 f"par rapport à la sensibilité du récepteur ({params.get('sensibilite_rx_dbm')} dBm). "
                 f"La marge système est de <b>{marge} dB</b>. "
                 f"Il est recommandé d'augmenter la puissance d'émission, les gains d'antenne ou de réduire la distance.")

    elements.append(Paragraph(concl, body_style))
    elements.append(Spacer(1, 0.5*cm))
    elements.append(Paragraph("ESP/UCAD — DIC2 INFO / M1 GLSI — Réseaux Télécoms et Services",
                               ParagraphStyle("footer", fontSize=8, textColor=GRAY, alignment=TA_CENTER)))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()
