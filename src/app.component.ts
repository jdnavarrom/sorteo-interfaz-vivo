import {Component, OnInit, signal} from "@angular/core"
import { CommonModule } from "@angular/common"
import { Observable } from "rxjs"
import { HeaderComponent } from "./components/header.component/header.component"
import { LiveRaffleMachineComponent } from "./components/live-raffle-machine.component/live-raffle-machine.component"
import { RaffleService } from "./services/raffle.service"
import { BrandingService } from "./services/branding.service"
import { Participant } from "./models/raffle.model"
import { SorteoService } from "./services/sorteo-service"
import {sorteoDto} from './models/sorteo.model';
import {ganadorDto} from './models/ganador.model';

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, HeaderComponent, LiveRaffleMachineComponent],
  templateUrl: "./app.component.html",
  styleUrls: ['./styles.css']
})
export class AppComponent implements OnInit {
  raffles$!: Observable<sorteoDto[]>
  selectedRaffle: sorteoDto | null = null
  showLiveRaffle = false
  participants: Participant[] = []
  sorteos: sorteoDto[];

  constructor(
    private raffleService: RaffleService,
    private brandingService: BrandingService,
    private sorteoService: SorteoService,
  ) {
    this.sorteos = [];
  }

  ngOnInit(): void {
    this.raffles$ = this.sorteoService.listarSorteos();
    console.log("Datos de sorteos" + this.raffles$);
  }

  handleStartLiveRaffle(raffle: sorteoDto): void {
    this.selectedRaffle = raffle
    console.log("seleccionado" + " " + raffle.codigo);
    this.showLiveRaffle = true
  }

  handleRaffleComplete(ganador: ganadorDto): void {
    console.log("Ganador del sorteo:", ganador.nombreCliente)
  }

  handleBackToRaffles(): void {
    this.showLiveRaffle = false
    this.selectedRaffle = null
  }

  getBrandingBackground(): string {
    if (this.selectedRaffle) {
      return this.brandingService.getBrandingForRaffle(this.selectedRaffle.promocion).background
    }
    return ""
  }
}
