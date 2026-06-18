import { db } from '../db'
import type { SaveSlot, GameState, StaffRecord } from '../db'
import type { Player, Team, League, Fixture, Champion } from '@types-app/index'

export const saveRepository = {
  // ---- Slot management ----

  async listSaveSlots(): Promise<SaveSlot[]> {
    return db.saveSlots.toArray()
  },

  async getSaveSlot(id: string): Promise<SaveSlot | undefined> {
    return db.saveSlots.get(id)
  },

  async deleteSaveSlot(id: string): Promise<void> {
    await db.saveSlots.delete(id)
    // If the deleted slot was the active one, remove the game state too
    const gs = await db.gameState.get('current')
    if (gs && gs.saveSlotId === id) {
      await db.gameState.delete('current')
    }
  },

  // ---- Save game ----

  async saveGame(slot: SaveSlot, gameState: GameState): Promise<void> {
    await db.transaction('rw', [db.saveSlots, db.gameState], async () => {
      await db.saveSlots.put({ ...slot, updatedAt: Date.now() })
      await db.gameState.put(gameState)
    })
  },

  // ---- Load game ----

  async loadGame(slotId: string): Promise<GameState | undefined> {
    const gs = await db.gameState.get('current')
    if (gs && gs.saveSlotId === slotId) return gs
    return undefined
  },

  // ---- New game ----

  /**
   * Wipes all game data and seeds fresh data for a new game.
   * Everything is wrapped in a single Dexie transaction for atomicity —
   * either everything is written or nothing is (on error).
   *
   * Staff is stored as StaffRecord (StaffMember + teamId flat) so it can be
   * queried by team. Pass staff records already enriched with teamId.
   */
  async initNewGame(
    slot: SaveSlot,
    gameState: GameState,
    players: Player[],
    teams: Team[],
    leagues: League[],
    staff: StaffRecord[],
    champions: Champion[],
    fixtures: Fixture[],
  ): Promise<void> {
    await db.transaction(
      'rw',
      [
        db.players,
        db.teams,
        db.leagues,
        db.fixtures,
        db.matchResults,
        db.staff,
        db.champions,
        db.saveSlots,
        db.gameState,
      ],
      async () => {
        // Clear all existing game data
        await db.players.clear()
        await db.teams.clear()
        await db.leagues.clear()
        await db.fixtures.clear()
        await db.matchResults.clear()
        await db.staff.clear()
        await db.champions.clear()

        // Seed fresh data
        await db.players.bulkPut(players)
        await db.teams.bulkPut(teams)
        await db.leagues.bulkPut(leagues)
        await db.fixtures.bulkPut(fixtures)
        await db.staff.bulkPut(staff)
        await db.champions.bulkPut(champions)

        // Persist slot metadata and active game state
        const now = Date.now()
        await db.saveSlots.put({ ...slot, createdAt: slot.createdAt || now, updatedAt: now })
        await db.gameState.put(gameState)
      },
    )
  },
}
