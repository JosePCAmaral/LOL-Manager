import type { MatchResult, MatchEvent } from '../types/index'
import { PixiApp } from './PixiApp'
import { MinimapScene } from './MinimapScene'
import { PlayerToken, INITIAL_POSITIONS } from './PlayerToken'
import { EventPlayer } from './EventPlayer'

// Roles in canonical order
const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const
type Role = typeof ROLES[number]

// Map engine role strings to short keys used in INITIAL_POSITIONS
const ROLE_NORMALISE: Record<string, string> = {
  TOP: 'TOP',
  JUNGLE: 'JUNGLE',
  JGL: 'JUNGLE',
  MID: 'MID',
  ADC: 'ADC',
  SUPPORT: 'SUPPORT',
  SUP: 'SUPPORT',
}

export interface MatchViewerCallbacks {
  onEventPlayed?: (event: MatchEvent) => void
  onMatchEnd?: () => void
}

const MAP_SIZE = 560

export class MatchViewer {
  private pixiApp: PixiApp
  private minimap: MinimapScene | null = null
  private tokens: Map<string, PlayerToken> = new Map()
  private eventPlayer: EventPlayer | null = null
  private destroyedTowers: string[] = []
  private tickerCallback: ((delta: { deltaTime: number; elapsedMS: number }) => void) | null = null
  private callbacks: MatchViewerCallbacks = {}

  constructor() {
    this.pixiApp = new PixiApp()
  }

  async mount(canvas: HTMLCanvasElement): Promise<void> {
    await this.pixiApp.init(canvas)
    // If destroy() was called while init was in flight, bail out.
    if (!this.pixiApp.initialized) return
    this.minimap = new MinimapScene(this.pixiApp.stage, MAP_SIZE)
  }

  loadMatch(matchResult: MatchResult, callbacks: MatchViewerCallbacks = {}): void {
    if (!this.pixiApp.initialized) return
    this.callbacks = callbacks
    this.destroyedTowers = []

    // Remove previous ticker callback
    this._removeTicker()

    // Reset minimap
    if (this.minimap) {
      // Rebuild minimap by recreating it
      this.pixiApp.stage.removeChildren()
      this.minimap = new MinimapScene(this.pixiApp.stage, MAP_SIZE)
    }

    // Remove old tokens from stage
    for (const token of this.tokens.values()) {
      this.pixiApp.stage.removeChild(token.view)
    }
    this.tokens.clear()

    // Create 10 player tokens (blue = teamA, red = teamB)
    const blueTeamId = matchResult.teamA
    const redTeamId = matchResult.teamB

    for (const role of ROLES) {
      const normRole = ROLE_NORMALISE[role] ?? role
      const initPos = INITIAL_POSITIONS[normRole]

      // Blue side token
      const blueKey = `blue-${role}`
      const blueToken = new PlayerToken({
        role,
        side: 'blue',
        label: role[0],
      })
      if (initPos) {
        blueToken.moveTo(initPos.blue.x, initPos.blue.y, MAP_SIZE)
      }
      this.pixiApp.stage.addChild(blueToken.view)
      this.tokens.set(blueKey, blueToken)

      // Red side token
      const redKey = `red-${role}`
      const redToken = new PlayerToken({
        role,
        side: 'red',
        label: role[0],
      })
      if (initPos) {
        redToken.moveTo(initPos.red.x, initPos.red.y, MAP_SIZE)
      }
      this.pixiApp.stage.addChild(redToken.view)
      this.tokens.set(redKey, redToken)
    }

    // Create event player
    this.eventPlayer = new EventPlayer(matchResult, {
      playbackSpeed: 1,
      onEventPlayed: (event) => {
        this._handleEvent(event, blueTeamId, redTeamId)
        callbacks.onEventPlayed?.(event)
      },
      onMatchEnd: () => {
        callbacks.onMatchEnd?.()
      },
    })

    // Register update in PixiJS ticker
    // Ticker provides deltaTime in frames (60fps = deltaTime ~1); elapsedMS for real ms
    const ticker = this.pixiApp.ticker
    this.tickerCallback = (delta) => {
      const deltaSeconds = delta.elapsedMS / 1000
      this.eventPlayer?.update(deltaSeconds)
    }
    ticker.add(this.tickerCallback)
  }

  play(): void {
    this.eventPlayer?.play()
  }

  pause(): void {
    this.eventPlayer?.pause()
  }

  reset(): void {
    this.eventPlayer?.reset()
  }

  skipToEnd(): void {
    this.eventPlayer?.skipToEnd()
  }

  setSpeed(speed: number): void {
    this.eventPlayer?.setSpeed(speed)
  }

  get currentMinute(): number {
    return this.eventPlayer?.currentMinute ?? 0
  }

  get progress(): number {
    return this.eventPlayer?.progress ?? 0
  }

  private _handleEvent(event: MatchEvent, blueTeamId: string, redTeamId: string): void {
    if (!this.minimap) return

    switch (event.type) {
      case 'kill': {
        // Find the victim token. We don't have player-to-role mapping in the event,
        // so we flash all tokens of the team that lost the player (best effort).
        // The kill event has killer and victim as player identifiers (IDs).
        // Since we only have role-based tokens, we animate a random alive token of victim's team.
        // In a richer implementation, the MatchResult draft would map player IDs to roles.
        const ticker = this.pixiApp.ticker
        // Try to find victim token by side — victim is on the opposite side of the killer team
        // We mark a token as dying visually for effect; pick the first alive token of losing side
        // (proper mapping requires player IDs in token config which is out of scope here)
        const victimSide = this._guessSideForPlayer(event.victim, blueTeamId, redTeamId)
        const killerSide = victimSide === 'blue' ? 'red' : 'blue'

        // Kill effect on killer side (any alive token of that side)
        const killerToken = this._getFirstAliveToken(killerSide)
        killerToken?.playKillEffect(ticker)

        // Death animation on victim side
        const victimToken = this._getFirstAliveToken(victimSide)
        victimToken?.playKillAnimation(ticker)
        break
      }

      case 'towerDestroyed': {
        // lane comes as 'top' | 'mid' | 'bot' in the event
        const side = event.team === blueTeamId ? 'blue' : 'red'
        const lane = event.lane as 'top' | 'mid' | 'bot'
        const towerId = `${side}-${lane}`
        if (!this.destroyedTowers.includes(towerId)) {
          this.destroyedTowers.push(towerId)
        }
        this.minimap.updateTowers(this.destroyedTowers)
        this.minimap.highlightLane(lane, side)
        break
      }

      case 'objective': {
        const side = event.team === blueTeamId ? 'blue' : 'red'
        if (event.objective === 'nexus') {
          this.minimap.updateNexus(side === 'blue' ? 'red' : 'blue', true)
        }
        // Highlight mid lane for Baron/Dragon/etc.
        this.minimap.highlightLane('mid', side)
        break
      }

      case 'goldUpdate':
      case 'itemPurchase':
        // Silent — handled by UI layer via callbacks
        break
    }
  }

  private _guessSideForPlayer(playerId: string, blueTeamId: string, _redTeamId: string): 'blue' | 'red' {
    // Without player-to-team lookup, we alternate sides heuristically based on ID hash
    let hash = 0
    for (let i = 0; i < playerId.length; i++) hash += playerId.charCodeAt(i)
    return hash % 2 === 0 ? 'blue' : 'red'
  }

  private _getFirstAliveToken(side: 'blue' | 'red'): PlayerToken | null {
    for (const [key, token] of this.tokens) {
      if (key.startsWith(side) && token.isAlive()) return token
    }
    return null
  }

  private _removeTicker(): void {
    if (this.tickerCallback) {
      this.pixiApp.ticker.remove(this.tickerCallback)
      this.tickerCallback = null
    }
  }

  destroy(): void {
    this._removeTicker()
    this.tokens.clear()
    this.eventPlayer = null
    this.minimap = null
    // Destroys the PixiJS Application and frees GPU resources
    this.pixiApp.destroy()
  }
}
