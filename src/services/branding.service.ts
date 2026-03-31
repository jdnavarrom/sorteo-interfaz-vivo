import { Injectable } from "@angular/core"
import { BrandingConfig } from "../models/raffle.model"

@Injectable({
  providedIn: "root",
})
export class BrandingService {
  getBrandingForRaffle(raffleTitle: string): BrandingConfig {
    if (raffleTitle.includes("MAS AVENTURAS")) {
      return {
        logo: "/Mas_aventuras_TITULO_CASTROL.avif",
        background: "/Mas_aventuras_FONDO_CASTROL.avif",
        alt: "Primer sorteo MAS AVENTURAS",
      }
    }

    if (raffleTitle.includes("ARRANCA VIAJA Y GANA")) {
      return {
        logo: "/Logo_ARRANCA_VIAJA_Y_GANA.avif",
        background: "/fondo_ARRANCA_VIAJA_Y_GANA.avif",
        alt: "ARRANCA VIAJA Y GANA",
      }
    }

    return {
      logo: "/cosecha_y_conduce_logo.avif",
      background: "/cosecha_y_conduce_fondo.avif",
      alt: "Cosecha y Conduce",
    }
  }
}
