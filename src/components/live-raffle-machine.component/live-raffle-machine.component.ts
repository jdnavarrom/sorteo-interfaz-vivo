import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LiveRaffleState, Participant, SlotReelState} from '../../models/raffle.model';
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
  ganador?: ganadorDto
  error: string;
    raffleState: LiveRaffleState = {
    isSpinning: false,
    participants: [],
    spinDuration: 20000,
    winner: undefined,
  };



  // 🔹 Inicialización segura para evitar undefined
  reels: SlotReelState[] = [{ names: [], currentIndex: 0, isSpinning: false, speed: 100 }];
  winnerCode: string | undefined = "";
  showingAction = false;
  actionReels = {
    actions: [

      "123e4567-e89b-12d3-a456-426614174000",
      "987fcdeb-51a2-43d7-8f9e-123456789abc",
      "456789ab-cdef-1234-5678-9abcdef01234",
      "fedcba98-7654-3210-fedc-ba9876543210",
      "11111111-2222-3333-4444-555555555555",
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "12345678-90ab-cdef-1234-567890abcdef",
      "abcdef12-3456-7890-abcd-ef1234567890",
      "99999999-8888-7777-6666-555555555555",
      "deadbeef-cafe-babe-dead-beefcafebabe",
      "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "550e8400-e29b-41d4-a716-446655440000",
      "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
      "87654321-4321-4321-4321-210987654321",
    ],
    currentIndex: 0,
    isSpinning: false,
  };

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
    this.sorteoService.ejecutarSorteo(this.sorteo).subscribe({
      next: (ganador) => {
        this.ganador = ganador;
      },
      error: (err) => {
        console.error("Error ejecutando sorteo:", err);
        this.error = err;
      }
    });

    this.winnerCode = this.ganador?.uuid;
    this.showingAction = true;

    this.raffleState.isSpinning = true;
    this.actionReels.isSpinning = true;

    this.actionIntervalRef = setInterval(() => {
      this.actionReels.currentIndex = (this.actionReels.currentIndex + 1) % this.actionReels.actions.length;
    }, 150);

    this.reels[0].isSpinning = true;
    this.intervalRefs[0] = setInterval(() => {
      this.reels[0].currentIndex = (this.reels[0].currentIndex + 1) % this.reels[0].names.length;
    }, this.reels[0].speed);

    setTimeout(() => {
      if (this.actionIntervalRef) {
        clearInterval(this.actionIntervalRef);
        this.actionIntervalRef = null;
      }
      this.actionReels.isSpinning = false;
    }, 10000);

    setTimeout(() => this.stopReel(0), 10000);

    setTimeout(() => {
      this.showingAction = false;
      const winner = this.ganador;
      this.raffleState.isSpinning = false;
      this.raffleState.winner = winner;
      this.raffleComplete.emit(winner);
    }, 20000);
  }

  resetRaffle(): void {
    this.clearAllIntervals();
    this.raffleState = {
      isSpinning: false,
      participants: this.participants,
      spinDuration: 20000,
      winner: undefined,
    };
    this.reels = this.reels.map(reel => ({ ...reel, isSpinning: false }));
    this.actionReels.isSpinning = false;
    this.actionReels.currentIndex = 0;
    this.winnerCode = "";
    this.showingAction = false;
  }

  private stopReel(reelIndex: number): void {
    if (this.intervalRefs[reelIndex]) {
      clearInterval(this.intervalRefs[reelIndex]);
      this.intervalRefs[reelIndex] = null;
    }
    this.reels[reelIndex].isSpinning = false;
  }

  private clearAllIntervals(): void {
    this.intervalRefs.forEach(interval => { if (interval) clearInterval(interval); });
    if (this.actionIntervalRef) { clearInterval(this.actionIntervalRef); this.actionIntervalRef = null; }
  }

  get branding() {
    return this.brandingService.getBrandingForRaffle(this.selectedRaffle?.promocion || "");
  }

  get currentDisplayText(): string {
    if (this.raffleState.isSpinning && this.showingAction) {
      console.log("UUID" + this.ganador?.uuid)
      return this.actionReels.isSpinning
        ? this.actionReels.actions[this.actionReels.currentIndex]
        : this.ganador?.uuid  || "---" ;

    } else if (this.raffleState.isSpinning && !this.showingAction) {
      return this.reels[0].names.length > 0 ? this.reels[0].names[this.reels[0].currentIndex] : "---";
    } else if (this.ganador?.nombreCliente && !this.showingAction) {
      return <string>this.raffleState.winner?.nombreCliente;
    }
    return "---";
  }

  // ✅ Getter seguro para el HTML
  get firstReelHasNames(): boolean {
    return this.reels.length > 0 && this.reels[0].names.length > 0;
  }

  get firstReel(): SlotReelState {
    return this.reels[0];
  }

}
