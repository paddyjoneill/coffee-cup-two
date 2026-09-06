import { useEffect } from 'react'
import type { GameControl } from './App'
interface Tool { name: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean }; execute: (input: unknown) => unknown }
declare global { interface Document { modelContext?: { registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void> } } }
export function useGameTools(game: GameControl, tap: () => void, reset: () => void) {
  useEffect(() => {
    const context = document.modelContext
    if (!context?.registerTool) return
    const lifecycle = new AbortController()
    const snapshot = () => ({ phase: game.current.phase, shot: { ...game.current.shot }, distance: game.current.distance, won: game.current.won, attempt: game.current.attempt, paused: game.current.paused })
    const tools: Tool[] = [
      { name: 'read_coffee_game', description: 'Read the current throwing stage, aim, distance, and result.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: snapshot },
      { name: 'play_coffee_game', description: 'Lock the current moving meter with tap, or restart the throw. The third tap launches the cup.', inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['tap', 'restart'] } }, required: ['action'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute(input) {
        if (!input || typeof input !== 'object' || !('action' in input) || Object.keys(input).length !== 1 || !['tap', 'restart'].includes(String(input.action))) throw new Error('Expected action: tap or restart')
        if (game.current.paused) throw new Error('Close the instructions before playing')
        if (input.action === 'restart') reset(); else tap()
        return snapshot()
      } },
    ]
    for (const tool of tools) { try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}) } catch { /* Optional browser API; normal controls remain available. */ } }
    return () => lifecycle.abort()
  }, [game, tap, reset])
}
