import { Injectable } from "@angular/core"
import { BrandingConfig } from "../models/raffle.model"

@Injectable({
  providedIn: "root",
})
export class BrandingService {
  getBrandingForRaffle(raffleTitle: string): BrandingConfig {
    if (raffleTitle.toLowerCase().includes("moto")) {
      return {
        logo: "/moto_adrenalina_logo.avif",
        background: "/moto_adrenalina_fondo.avif",
        alt: "Moto Adrenalina",
      }
    }

    return {
      logo: "/cosecha_y_conduce_logo.avif",
      background: "/cosecha_y_conduce_fondo.avif",
      alt: "Cosecha y Conduce",
    }
  }
}
