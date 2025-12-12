import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LiveRaffleState, Participant} from '../../models/raffle.model';
import {BrandingService} from '../../services/branding.service';
import {SorteoService} from '../../services/sorteo-service';
import {sorteoDto} from '../../models/sorteo.model';
import {ganadorDto} from '../../models/ganador.model';

@Component({
  selector: 'app-live-raffle-machine',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-raffle-machine.component.html',
  styleUrls: ['./live-raffle-machine.component.css']
})
export class LiveRaffleMachineComponent implements OnInit, OnDestroy {

  @Input() participants: Participant[] = [];
  @Input() selectedRaffle?: sorteoDto;
  @Output() raffleComplete = new EventEmitter<ganadorDto>();
  sorteo: number | undefined = 0;
  ganadores: ganadorDto[] = [];
  error: string;
  raffleState: LiveRaffleState = {
    isSpinning: false,
    participants: [],
    spinDuration: 8000,
    winner: undefined,
  };

  showingAction = false;
  private intervalRefs: (any | null)[] = [null];
  private actionIntervalRef: any = null;

  constructor(
    private brandingService: BrandingService,
    private sorteoService: SorteoService,
  ) {
    this.error = "";
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.clearAllIntervals();
  }

  startRaffle(): void {
    this.sorteo = this.selectedRaffle?.codigo.valueOf();
    if (!this.sorteo) return;

    this.showingAction = true;
    this.raffleState.isSpinning = true;

    this.sorteoService.ejecutarSorteo(this.sorteo).subscribe({
      next: (respuesta) => {
        console.log("Ganadores recibidos:", respuesta);
        this.ganadores = respuesta ?? [];
      },
      error: (err) => {
        console.error("Error ejecutando sorteo:", err);
        this.error = err;
      }
    });


    setTimeout(() => {
      this.showingAction = false;
      this.raffleState.isSpinning = false;
      this.raffleState.winner = this.ganadores.length > 0 ? this.ganadores[0] : undefined;
      this.raffleComplete.emit(this.ganadores[0]);
    }, 8000);
  }

  private clearAllIntervals(): void {
    this.intervalRefs.forEach(interval => {
      if (interval) clearInterval(interval);
    });
    if (this.actionIntervalRef) {
      clearInterval(this.actionIntervalRef);
      this.actionIntervalRef = null;
    }
  }

  get branding() {
    return this.brandingService.getBrandingForRaffle(this.selectedRaffle?.promocion || "");
  }

  // Getter para el título adaptable
  get winnersTitle(): string {
    const n = this.ganadores.length;
    if (this.raffleState.isSpinning) return 'Sorteando...';
    if (n === 0) return 'Resultados';
    if (n === 1) return '🏆 GANADOR';
    return '🏆 GANADORES';
  }

// Getter que indica si debe mostrarse la ruleta (spinner)
  get showRoulette(): boolean {
    return this.raffleState.isSpinning && this.showingAction;
  }

}
