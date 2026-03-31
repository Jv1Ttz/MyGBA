import { useEffect, useState } from 'react'
import type { CheatStatus, EmulatorStatus, GBAButton } from '../hooks/useEmulator'
import { RomLoader } from './RomLoader'
import { CheatLoader } from './CheatLoader'

const MAPPING_ACTIONS: GBAButton[] = [
  'Up',
  'Down',
  'Left',
  'Right',
  'A',
  'B',
  'L',
  'R',
  'Start',
  'Select',
]

interface Props {
  status: EmulatorStatus
  romName: string | null
  volume: number
  speed: number
  keyBindings: Record<GBAButton, string>
  onSetKeyBinding: (button: GBAButton, key: string) => void
  onResetKeyBindings: () => void
  onBindingModeChange: (isBinding: boolean) => void
  cheatStatus: CheatStatus
  cheatFileName: string | null
  authEmail: string
  userEmail: string | null
  authMessage: string | null
  syncStatus: 'idle' | 'syncing' | 'ready' | 'error'
  onAuthEmailChange: (email: string) => void
  onSignIn: () => void
  onSignOut: () => void
  onRomSelected: (file: File) => void
  onUploadCheats: (file: File) => boolean
  onApplyCheatText: (cheatText: string) => boolean
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

export function ControlPanel({
  status,
  romName,
  volume,
  speed,
  keyBindings,
  onSetKeyBinding,
  onResetKeyBindings,
  onBindingModeChange,
  cheatStatus,
  cheatFileName,
  authEmail,
  userEmail,
  authMessage,
  syncStatus,
  onAuthEmailChange,
  onSignIn,
  onSignOut,
  onRomSelected,
  onUploadCheats,
  onApplyCheatText,
  onPause,
  onResume,
  onReset,
  onQuit,
  onSaveState,
  onLoadState,
  onVolumeChange,
  onSpeedChange,
}: Props) {
  const [saveSlot, setSaveSlot] = useState(1)
  const [selectedButton, setSelectedButton] = useState<GBAButton | null>(null)
  const isActive = status === 'running' || status === 'paused'
  const isRunning = status === 'running'

  useEffect(() => {
    if (!selectedButton) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return
      const target = event.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      onSetKeyBinding(selectedButton!, key)
      setSelectedButton(null)
      onBindingModeChange(false)
      event.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedButton, onSetKeyBinding, onBindingModeChange])

  function startRemap(button: GBAButton) {
    setSelectedButton(button)
    onBindingModeChange(true)
  }

  function cancelRemap() {
    setSelectedButton(null)
    onBindingModeChange(false)
  }

  const bindingMessage = selectedButton
    ? `Pressione uma tecla para mapear ${selectedButton}`
    : null

  return (
    <div className="flex flex-col gap-5 w-full p-4 bg-gray-900 border-t border-gray-800">

      {/* ROM */}
      <section className="flex flex-col gap-2">
        <span className="text-gray-500 text-xs uppercase tracking-widest">ROM</span>
        <RomLoader onRomSelected={onRomSelected} disabled={status === 'loading'} />
        {romName ? (
          <p className="text-gray-400 text-xs truncate" title={romName}>{romName}</p>
        ) : (
          <p className="text-gray-600 text-xs">Nenhuma ROM carregada</p>
        )}
      </section>

      <div className="border-t border-gray-800" />

      <section className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-gray-900 border border-gray-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-gray-500 text-xs uppercase tracking-widest">Sincronização</span>
              <p className="text-gray-400 text-xs">Use Supabase para salvar preferências entre dispositivos.</p>
            </div>
            {userEmail ? (
              <button
                type="button"
                onClick={onSignOut}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Sair
              </button>
            ) : null}
          </div>

          {userEmail ? (
            <div className="flex flex-col gap-1 text-gray-300 text-xs">
              <span>Conectado como <strong>{userEmail}</strong></span>
              <span>Estado de sync: {syncStatus}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                type="email"
                value={authEmail}
                onChange={(event) => onAuthEmailChange(event.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={onSignIn}
                className="w-full py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              >
                Entrar com link mágico
              </button>
            </div>
          )}

          {authMessage ? (
            <p className="text-gray-400 text-xs">{authMessage}</p>
          ) : null}
        </div>
      </section>

      <div className="border-t border-gray-800" />

      <section className="flex flex-col gap-2">
        <CheatLoader
          onUploadCheats={onUploadCheats}
          onApplyCheatText={onApplyCheatText}
          disabled={status === 'loading'}
          status={cheatStatus}
          fileName={cheatFileName}
        />
      </section>

      <div className="border-t border-gray-800" />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-widest">Mapeamento</span>
            <p className="text-gray-400 text-xs">Configure teclas manuais para controles do GBA.</p>
          </div>
          <button
            type="button"
            onClick={onResetKeyBindings}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            Reset defaults
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {MAPPING_ACTIONS.map((button) => (
            <button
              key={button}
              type="button"
              onClick={() => startRemap(button)}
              className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors border ${
                selectedButton === button
                  ? 'border-purple-500 bg-purple-500/10 text-white'
                  : 'border-gray-800 bg-gray-800 text-gray-300 hover:border-gray-700 hover:bg-gray-800'
              }`}
            >
              <span>{button}</span>
              <span className="font-mono text-xs uppercase text-gray-200">{keyBindings[button]}</span>
            </button>
          ))}
        </div>

        {bindingMessage && (
          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500 text-purple-100 text-sm">
            <span>{bindingMessage}</span>
            <button
              type="button"
              onClick={cancelRemap}
              className="px-2 py-1 rounded bg-purple-500 text-white text-xs"
            >
              Cancelar
            </button>
          </div>
        )}
      </section>

      <div className="border-t border-gray-800" />

      {/* Playback */}
      <section className="flex flex-col gap-2">
        <span className="text-gray-500 text-xs uppercase tracking-widest">Controle</span>
        <div className="flex gap-2">
          {/* Play / Pause */}
          <button
            disabled={!isActive}
            onClick={isRunning ? onPause : onResume}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
            title={isRunning ? 'Pausar' : 'Continuar'}
          >
            {isRunning ? (
              <>
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <rect x="5" y="4" width="3" height="12" rx="1" />
                  <rect x="12" y="4" width="3" height="12" rx="1" />
                </svg>
                Pausar
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Play
              </>
            )}
          </button>

          {/* Reset */}
          <button
            disabled={!isActive}
            onClick={onReset}
            className="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
            title="Reiniciar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>

        {/* Quit */}
        {isActive && (
          <button
            onClick={onQuit}
            className="w-full py-1.5 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
          >
            Sair do jogo
          </button>
        )}
      </section>

      <div className="border-t border-gray-800" />

      {/* Speed */}
      <section className="flex flex-col gap-2">
        <span className="text-gray-500 text-xs uppercase tracking-widest">Velocidade</span>
        <div className="flex flex-wrap gap-1.5">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                speed === s
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              {s === 0.5 ? '½x' : `${s}x`}
            </button>
          ))}
        </div>
      </section>

      <div className="border-t border-gray-800" />

      {/* Volume */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-xs uppercase tracking-widest">Volume</span>
          <span className="text-gray-500 text-xs font-mono">{Math.round(volume * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={0.05}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
      </section>

      <div className="border-t border-gray-800" />

      {/* Save States */}
      <section className="flex flex-col gap-2">
        <span className="text-gray-500 text-xs uppercase tracking-widest">Save States</span>
        <div className="flex gap-1.5">
          {SAVE_SLOTS.map((slot) => (
            <button
              key={slot}
              onClick={() => setSaveSlot(slot)}
              className={`flex-1 py-1 rounded text-xs font-mono transition-colors ${
                saveSlot === slot
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            disabled={!isActive}
            onClick={() => onSaveState(saveSlot)}
            className="flex-1 py-2 rounded-lg text-xs font-medium bg-purple-700 hover:bg-purple-600 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            💾 Salvar
          </button>
          <button
            disabled={!isActive}
            onClick={() => onLoadState(saveSlot)}
            className="flex-1 py-2 rounded-lg text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            📂 Carregar
          </button>
        </div>
      </section>

      {/* Spacer + controls reference */}
      <div className="mt-auto border-t border-gray-800 pt-4">
        <span className="text-gray-600 text-xs uppercase tracking-widest block mb-2">Controles</span>
        <div className="flex flex-col gap-1 text-gray-500 text-[11px] leading-tight mb-3">
          <p>Touch overlay disponível no canto da tela.</p>
          <p>Conecte um gamepad para usar controles físicos.</p>
        </div>
        <div className="flex flex-col gap-1">
          {[
            ['←→↑↓', 'D-Pad'],
            ['X', 'A'],
            ['Z', 'B'],
            ['A', 'L'],
            ['S', 'R'],
            ['Enter', 'Start'],
            ['Shift', 'Select'],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-mono text-xs">{key}</kbd>
              <span className="text-gray-600 text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
