import { Container, Graphics } from 'pixi.js'

const TOWER_POSITIONS = {
  blue: [
    { x: 0.15, y: 0.75, lane: 'top', id: 'blue-top' },
    { x: 0.45, y: 0.55, lane: 'mid', id: 'blue-mid' },
    { x: 0.75, y: 0.85, lane: 'bot', id: 'blue-bot' },
  ],
  red: [
    { x: 0.25, y: 0.15, lane: 'top', id: 'red-top' },
    { x: 0.55, y: 0.45, lane: 'mid', id: 'red-mid' },
    { x: 0.85, y: 0.25, lane: 'bot', id: 'red-bot' },
  ],
}

const NEXUS_POSITIONS = {
  blue: { x: 0.08, y: 0.92 },
  red: { x: 0.92, y: 0.08 },
}

export class MinimapScene {
  private container: Container
  private size: number
  private towerGraphics: Map<string, Graphics> = new Map()
  private nexusGraphics: Map<string, Graphics> = new Map()
  private laneHighlight: Graphics
  private highlightTimer: ReturnType<typeof setTimeout> | null = null

  constructor(parent: Container, size: number = 560) {
    this.size = size
    this.container = new Container()
    parent.addChild(this.container)
    this.laneHighlight = new Graphics()
    this.build()
  }

  private build(): void {
    const s = this.size

    // Map background
    const mapBg = new Graphics()
    mapBg.rect(0, 0, s, s)
    mapBg.fill({ color: 0x0d2b1d })
    this.container.addChild(mapBg)

    // Lane paths
    const lanes = new Graphics()
    lanes.moveTo(s * 0.10, s * 0.90)
    lanes.lineTo(s * 0.10, s * 0.10)
    lanes.lineTo(s * 0.90, s * 0.10)
    lanes.moveTo(s * 0.10, s * 0.90)
    lanes.lineTo(s * 0.90, s * 0.90)
    lanes.lineTo(s * 0.90, s * 0.10)
    lanes.moveTo(s * 0.10, s * 0.90)
    lanes.lineTo(s * 0.90, s * 0.10)
    lanes.stroke({ color: 0x1a3a2a, width: 12, alpha: 0.8 })
    this.container.addChild(lanes)

    // River
    const river = new Graphics()
    river.moveTo(0, s)
    river.lineTo(s, 0)
    river.stroke({ color: 0x1a5276, width: 10, alpha: 0.5 })
    this.container.addChild(river)

    // Lane highlight layer (on top of map, below tokens)
    this.container.addChild(this.laneHighlight)

    // Towers
    for (const side of ['blue', 'red'] as const) {
      const color = side === 'blue' ? 0x3498db : 0xe74c3c
      for (const pos of TOWER_POSITIONS[side]) {
        const g = new Graphics()
        g.rect(pos.x * s - 6, pos.y * s - 6, 12, 12)
        g.fill({ color })
        g.rect(pos.x * s - 6, pos.y * s - 6, 12, 12)
        g.stroke({ color: 0xffffff, width: 1, alpha: 0.5 })
        this.container.addChild(g)
        this.towerGraphics.set(pos.id, g)
      }
    }

    // Nexus circles
    for (const side of ['blue', 'red'] as const) {
      const color = side === 'blue' ? 0x2980b9 : 0xc0392b
      const pos = NEXUS_POSITIONS[side]
      const g = new Graphics()
      g.circle(pos.x * s, pos.y * s, 14)
      g.fill({ color })
      g.circle(pos.x * s, pos.y * s, 14)
      g.stroke({ color: 0xffffff, width: 2, alpha: 0.8 })
      this.container.addChild(g)
      this.nexusGraphics.set(side, g)
    }
  }

  updateTowers(destroyedTowerIds: string[]): void {
    for (const [id, g] of this.towerGraphics) {
      if (destroyedTowerIds.includes(id)) {
        g.alpha = 0.35
        g.tint = 0x888888
      }
    }
  }

  updateNexus(side: 'blue' | 'red', destroyed: boolean): void {
    const g = this.nexusGraphics.get(side)
    if (!g) return
    if (destroyed) {
      g.alpha = 0.3
      g.tint = 0x444444
    }
  }

  highlightLane(lane: 'top' | 'mid' | 'bot', side: 'blue' | 'red'): void {
    const s = this.size
    const color = side === 'blue' ? 0x3498db : 0xe74c3c

    if (this.highlightTimer !== null) {
      clearTimeout(this.highlightTimer)
      this.highlightTimer = null
    }

    this.laneHighlight.clear()

    if (lane === 'top') {
      this.laneHighlight.rect(0, 0, s * 0.22, s)
      this.laneHighlight.fill({ color, alpha: 0.18 })
    } else if (lane === 'mid') {
      this.laneHighlight.rect(s * 0.28, s * 0.28, s * 0.44, s * 0.44)
      this.laneHighlight.fill({ color, alpha: 0.18 })
    } else {
      // bot
      this.laneHighlight.rect(0, s * 0.78, s, s * 0.22)
      this.laneHighlight.fill({ color, alpha: 0.18 })
    }

    this.highlightTimer = setTimeout(() => {
      this.laneHighlight.clear()
      this.highlightTimer = null
    }, 800)
  }

  get view(): Container {
    return this.container
  }
}
