import type { MatchResult, MatchEvent } from '../types/index'

export interface EventPlayerOptions {
  playbackSpeed: number
  onEventPlayed: (event: MatchEvent) => void
  onMatchEnd: () => void
}

// MatchEvent uses `time` (seconds in game) not `minute`.
// We map game-seconds to playback-seconds at a ratio of 60:1 (1 game-minute = 1 playback-second).
const SECONDS_PER_PLAYBACK_SECOND = 60

export class EventPlayer {
  private events: MatchEvent[]
  private currentEventIndex: number = 0
  private isPlaying: boolean = false
  private elapsedPlaybackSeconds: number = 0
  private options: EventPlayerOptions

  constructor(matchResult: MatchResult, options: EventPlayerOptions) {
    // Sort events by time ascending to guarantee order
    this.events = [...matchResult.timeline].sort((a, b) => a.time - b.time)
    this.options = { ...options }
  }

  play(): void {
    this.isPlaying = true
  }

  pause(): void {
    this.isPlaying = false
  }

  reset(): void {
    this.isPlaying = false
    this.currentEventIndex = 0
    this.elapsedPlaybackSeconds = 0
  }

  skipToEnd(): void {
    while (this.currentEventIndex < this.events.length) {
      this.options.onEventPlayed(this.events[this.currentEventIndex])
      this.currentEventIndex++
    }
    this.isPlaying = false
    this.options.onMatchEnd()
  }

  setSpeed(speed: number): void {
    this.options.playbackSpeed = speed
  }

  // Called by the PixiJS Ticker each frame; deltaTimeSeconds = frame duration in real seconds
  update(deltaTimeSeconds: number): void {
    if (!this.isPlaying) return

    this.elapsedPlaybackSeconds += deltaTimeSeconds * this.options.playbackSpeed

    // Convert playback seconds to game seconds
    const currentGameSeconds = this.elapsedPlaybackSeconds * SECONDS_PER_PLAYBACK_SECOND

    while (
      this.currentEventIndex < this.events.length &&
      this.events[this.currentEventIndex].time <= currentGameSeconds
    ) {
      const event = this.events[this.currentEventIndex]
      this.options.onEventPlayed(event)
      this.currentEventIndex++
    }

    if (this.currentEventIndex >= this.events.length) {
      this.isPlaying = false
      this.options.onMatchEnd()
    }
  }

  // Returns current in-game minute
  get currentMinute(): number {
    return Math.floor((this.elapsedPlaybackSeconds * SECONDS_PER_PLAYBACK_SECOND) / 60)
  }

  // Normalised progress [0, 1]
  get progress(): number {
    if (this.events.length === 0) return 1
    const lastEventTime = this.events[this.events.length - 1].time
    if (lastEventTime <= 0) return 1
    const current = this.elapsedPlaybackSeconds * SECONDS_PER_PLAYBACK_SECOND
    return Math.min(1, current / lastEventTime)
  }
}
