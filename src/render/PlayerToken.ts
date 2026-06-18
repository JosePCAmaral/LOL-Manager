import { Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js'

export interface TokenConfig {
  role: string          // 'TOP' | 'JGL' | 'MID' | 'ADC' | 'SUP'
  side: 'blue' | 'red'
  label?: string
}

const SIDE_COLORS: Record<string, number> = {
  blue: 0x3498db,
  red: 0xe74c3c,
}

const ROLE_LABEL: Record<string, string> = {
  TOP: 'T',
  JGL: 'J',
  JUNGLE: 'J',
  MID: 'M',
  ADC: 'A',
  SUPPORT: 'S',
  SUP: 'S',
}

// Normalised [0,1] starting positions
export const INITIAL_POSITIONS: Record<string, Record<'blue' | 'red', { x: number; y: number }>> = {
  TOP:     { blue: { x: 0.12, y: 0.88 }, red: { x: 0.88, y: 0.12 } },
  JUNGLE:  { blue: { x: 0.25, y: 0.75 }, red: { x: 0.75, y: 0.25 } },
  JGL:     { blue: { x: 0.25, y: 0.75 }, red: { x: 0.75, y: 0.25 } },
  MID:     { blue: { x: 0.20, y: 0.80 }, red: { x: 0.80, y: 0.20 } },
  ADC:     { blue: { x: 0.10, y: 0.90 }, red: { x: 0.90, y: 0.10 } },
  SUPPORT: { blue: { x: 0.08, y: 0.92 }, red: { x: 0.92, y: 0.08 } },
  SUP:     { blue: { x: 0.08, y: 0.92 }, red: { x: 0.92, y: 0.08 } },
}

export class PlayerToken {
  private container: Container
  private circle: Graphics
  private labelText: Text
  private config: TokenConfig
  private alive: boolean = true

  constructor(config: TokenConfig) {
    this.config = config
    this.container = new Container()

    const color = SIDE_COLORS[config.side] ?? 0x888888
    const roleKey = config.role.toUpperCase()
    const short = config.label ?? ROLE_LABEL[roleKey] ?? roleKey[0]

    // Circle background
    this.circle = new Graphics()
    this.circle.circle(0, 0, 12)
    this.circle.fill({ color })
    this.circle.circle(0, 0, 12)
    this.circle.stroke({ color: 0xffffff, width: 2, alpha: 0.9 })

    // Role label
    const style = new TextStyle({
      fontSize: 10,
      fill: 0xffffff,
      fontWeight: 'bold',
      fontFamily: 'Arial',
    })
    this.labelText = new Text({ text: short, style })
    this.labelText.anchor.set(0.5)

    this.container.addChild(this.circle)
    this.container.addChild(this.labelText)
  }

  get view(): Container {
    return this.container
  }

  moveTo(nx: number, ny: number, mapSize: number): void {
    this.container.x = nx * mapSize
    this.container.y = ny * mapSize
  }

  setAlive(alive: boolean): void {
    this.alive = alive
    if (!alive) {
      this.container.alpha = 0.25
    } else {
      this.container.alpha = 1
      this.container.scale.set(1)
      this.container.visible = true
    }
  }

  playKillAnimation(ticker: Ticker): void {
    // This token is the victim — fade and shrink
    this.container.visible = true
    this.container.alpha = 1
    this.container.scale.set(1)
    let t = 0

    const onTick = (delta: { deltaTime: number }) => {
      t += delta.deltaTime / 30
      this.container.alpha = Math.max(0, 1 - t * 2)
      this.container.scale.set(Math.max(0.1, 1 - t))
      if (t >= 0.5) {
        ticker.remove(onTick)
        this.container.visible = false
        this.container.alpha = 0.25
        this.container.scale.set(1)
      }
    }
    ticker.add(onTick)
  }

  playKillEffect(ticker: Ticker): void {
    // This token got a kill — brief gold pulse
    const originalTint = this.circle.tint
    this.circle.tint = 0xf1c40f
    let t = 0

    const onTick = (delta: { deltaTime: number }) => {
      t += delta.deltaTime / 30
      if (t >= 0.4) {
        ticker.remove(onTick)
        this.circle.tint = originalTint
      }
    }
    ticker.add(onTick)
  }

  isAlive(): boolean {
    return this.alive
  }
}
