import { Injectable } from "@angular/core"
import { BrandingConfig } from "../models/raffle.model"

@Injectable({
  providedIn: "root",
})
export class BrandingService {
  getBrandingForRaffle(raffleTitle: string): BrandingConfig {
    if (raffleTitle.includes("Grupo Q")) {
      return {
        logo: "moto_adrenalina_logo.avif",
        background: "moto_adrenalina_fondo.avif",
        alt: "Motocicleta Crossmax 250 Grupo Q",
      }
    }

    if (raffleTitle.includes("Ferre TODO Terreno")) {
      return {
        logo: "/FerreTODOterreno_logo.avif",
        background: "/FerreTODOterreno_fondo.avif",
        alt: "Ferre TODO Terreno",
      }
    }

    return {
      logo: "/cosecha_y_conduce_logo.avif",
      background: "/cosecha_y_conduce_fondo.avif",
      alt: "Cosecha y Conduce",
    }
  }
}
