import {ganadorDto} from './ganador.model';

export interface Participant {
  id: string
  name: string
  email: string
  phone?: string
  registeredAt: Date
}

export interface LiveRaffleState {
  isSpinning: boolean
  winner?: ganadorDto
  participants: Participant[]
  spinDuration: number
}

export interface SlotReelState {
  names: string[]
  currentIndex: number
  isSpinning: boolean
  speed: number
}

export interface BrandingConfig {
  logo: string
  background: string
  alt: string
}
