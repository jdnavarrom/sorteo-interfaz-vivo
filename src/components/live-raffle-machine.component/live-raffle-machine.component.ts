import {Component, ChangeDetectorRef, EventEmitter, Input, OnDestroy, OnInit, OnChanges, SimpleChanges, Output, Renderer2} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LiveRaffleState, Participant} from '../../models/raffle.model';
import {SorteoService} from '../../services/sorteo-service';
import {sorteoDto} from '../../models/sorteo.model';
import {ganadorDto} from '../../models/ganador.model';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-live-raffle-machine',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-raffle-machine.component.html',
  styleUrls: ['./live-raffle-machine.component.css']
})
export class LiveRaffleMachineComponent implements OnInit, OnDestroy, OnChanges {

  @Input() participants: Participant[] = [];
  @Input() selectedRaffle?: sorteoDto;
  @Output() raffleComplete = new EventEmitter<ganadorDto>();
  sorteo: number | undefined = 0;
  raffles$!: Observable<sorteoDto[]>
  ganadores: ganadorDto[] = [];
  sorteoSeleccionado: sorteoDto;
  sorteos: sorteoDto[] = [];
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
    private sorteoService: SorteoService,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
  ) {
    this.error = "";
    this.sorteoSeleccionado = {} as sorteoDto;
  }

  ngOnInit(): void {
    this.raffles$ = this.sorteoService.listarSorteos();
    this.sorteoService.listarSorteos().subscribe(sorteos => {
      this.sorteos = sorteos;
      this.cdr.detectChanges();
      this.setBodyBackground();
    });
    this.setBodyBackground();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedRaffle']) {
      this.setBodyBackground();
    }
  }

  ngOnDestroy(): void {
    this.clearAllIntervals();
    this.clearBodyBackground();
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

  setBodyBackground() {
    const background = this.branding.background;
    this.renderer.setStyle(document.body, 'background-image', `url('${background}')`);
    this.renderer.setStyle(document.body, 'background-size', 'cover');
    this.renderer.setStyle(document.body, 'background-position', 'center');
    this.renderer.setStyle(document.body, 'background-repeat', 'no-repeat');
  }

  clearBodyBackground() {
    this.renderer.removeStyle(document.body, 'background-image');
    this.renderer.removeStyle(document.body, 'background-size');
    this.renderer.removeStyle(document.body, 'background-position');
    this.renderer.removeStyle(document.body, 'background-repeat');
  }

  get branding() {
    const sorteo = this.sorteos.find(s => s.promocion === this.selectedRaffle?.promocion);
    // Utiliza backgroundUrl del sorteo si existe y no está vacío
    let background = sorteo?.backgroundUrl || this.selectedRaffle?.backgroundUrl || '';
    if (background && !background.startsWith('/')) {
      background = '/' + background;
    }
    if (!background || background.trim() === '') {
      background = '/cosecha_y_conduce_fondo.avif';
    }
    // Lo mismo para el logo
    let logo = sorteo?.imageUrl || this.selectedRaffle?.imageUrl || '';
    if (logo && !logo.startsWith('/')) {
      logo = '/' + logo;
    }
    if (!logo || logo.trim() === '') {
      logo = '/cosecha_y_conduce_logo.aviv';
    }
    const alt = sorteo?.promocion || this.selectedRaffle?.promocion || 'Sorteo';
    console.log('branding:', {logo, background, alt, sorteo, selectedRaffle: this.selectedRaffle});
    return { logo, background, alt };
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
