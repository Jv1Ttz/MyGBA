import { useState } from 'react'
import type { EmulatorStatus } from '../hooks/useEmulator'
import { RomLoader } from './RomLoader'

interface Props {
  status: EmulatorStatus
  romName: string | null
  volume: number
  speed: number
  onRomSelected: (file: File) => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onQuit: () => void
  onSaveState: (slot: number) => void
  onLoadState: (slot: number) => void
  onVolumeChange: (v: number) => void
  onSpeedChange: (s: number) => void
}

const SPEED_OPTIONS = [0.5, 1, 2, 3, 4]
const SAVE_SLOTS = [1, 2, 3, 4]

export function Toolbar({
  status,
  romName,
  volume,
  speed,
  onRomSelected,
  onPause,
  onResume,
  onReset,
  onQuit,
  onSaveState,
  onLoadState,
  onVolumeChange,
  onSpeedChange,
}: Props) {
  const [showSaveMenu, setShowSaveMenu] = useState(false)
  const isActive = status === 'running' || status === 'paused'
  const isRunning = status === 'running'

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-gray-900 border-t border-gray-800">
      {/* ROM info */}
      <div className="flex items-center gap-2 min-w-0 mr-auto">
        <RomLoader onRomSelected={onRomSelected} disabled={status === 'loading'} />
        {romName && (
          <span className="text-gray-400 text-xs truncate max-w-32" title={romName}>
            {romName}
          </span>
        )}
      </div>

      {/* Controls (only when a game is loaded) */}
      {isActive && (
        <>
          {/* Play / Pause */}
          <button
            onClick={isRunning ? onPause : onResume}
            className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            title={isRunning ? 'Pausar' : 'Continuar'}
          >
            {isRunning ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <rect x="5" y="4" width="3" height="12" rx="1" />
                <rect x="12" y="4" width="3" height="12" rx="1" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            )}
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            title="Reiniciar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          {/* Speed selector */}
          <div className="flex items-center gap-1">
            <span className="text-gray-500 text-xs">⚡</span>
            <select
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-1.5 py-1 focus:outline-none focus:border-purple-500"
            >
              {SPEED_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === 0.5 ? '0.5x' : `${s}x`}
                </option>
              ))}
            </select>
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-xs">🔊</span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-20 accent-purple-500"
            />
          </div>

          {/* Save states */}
          <div className="relative">
            <button
              onClick={() => setShowSaveMenu((v) => !v)}
              className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-gray-300 hover:text-white hover:bg-gray-700 border border-gray-700 hover:border-gray-500 transition-colors"
            >
              💾 States
            </button>
            {showSaveMenu && (
              <div
                className="absolute bottom-full right-0 mb-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 flex gap-3 z-10"
                onMouseLeave={() => setShowSaveMenu(false)}
              >
                {SAVE_SLOTS.map((slot) => (
                  <div key={slot} className="flex flex-col items-center gap-1">
                    <span className="text-gray-500 text-xs">#{slot}</span>
                    <button
                      onClick={() => { onSaveState(slot); setShowSaveMenu(false) }}
                      className="px-2 py-1 text-xs rounded bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { onLoadState(slot); setShowSaveMenu(false) }}
                      className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quit */}
          <button
            onClick={onQuit}
            className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sair do jogo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
