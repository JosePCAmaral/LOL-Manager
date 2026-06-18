import { Application, Container } from 'pixi.js'

export class PixiApp {
  private app: Application
  private root: Container
  private _initialized = false
  private _destroyed = false

  constructor() {
    this.app = new Application()
    this.root = new Container()
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    await this.app.init({
      canvas,
      width: 800,
      height: 600,
      background: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })
    // If destroy() was called while init was in flight, clean up and bail out.
    if (this._destroyed) {
      this.app.destroy(false, { children: true })
      return
    }
    this._initialized = true
    this.app.stage.addChild(this.root)
  }

  get initialized(): boolean {
    return this._initialized
  }

  get stage(): Container {
    return this.root
  }

  get ticker() {
    return this.app.ticker
  }

  get renderer() {
    return this.app.renderer
  }

  destroy(): void {
    this._destroyed = true
    if (!this._initialized) return
    // false = do not remove canvas from DOM (React controls that)
    this.app.destroy(false, { children: true })
    this._initialized = false
  }
}
