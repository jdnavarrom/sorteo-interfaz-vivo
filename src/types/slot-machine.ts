export interface SlotMachine {
  id: string
  name: string
  theme: "classic" | "modern" | "vintage"
  costPerSpin: number
  prizes: SlotPrize[]
  isActive: boolean
  jackpot: number
}

export interface SlotPrize {
  id: string
  name: string
  image: string
  value: number
  probability: number // 0-100
  type: "coins" | "prize" | "jackpot"
  description: string
}

export interface UserWallet {
  userId: string
  coins: number
  totalSpent: number
  totalWon: number
  lastActivity: Date
}

export interface SpinResult {
  id: string
  userId: string
  machineId: string
  symbols: string[]
  prize?: SlotPrize
  coinsWon: number
  timestamp: Date
  isWinner: boolean
}

export interface GameSession {
  id: string
  userId: string
  startTime: Date
  endTime?: Date
  totalSpins: number
  totalSpent: number
  totalWon: number
  biggestWin: number
}
