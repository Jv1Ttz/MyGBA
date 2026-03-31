import { useEffect, useRef, useState, useCallback } from 'react'
import type { EmulatorStatus, GBAButton } from '../hooks/useEmulator'

const GAMEPAD_AXIS_THRESHOLD = 0.6
const GAMEPAD_BUTTON_MAP: Partial<Record<number, GBAButton>> = {
  0: 'A',
  1: 'B',
  4: 'L',
  5: 'R',
  8: 'Select',
  9: 'Start',
  12: 'Up',
  13: 'Down',
  14: 'Left',
  15: 'Right',
}

interface Props {
  onInit: (canvas: HTMLCanvasElement) => void
  status: EmulatorStatus
  romName: string | null
  keyBindings: Record<GBAButton, string>
  onPressButton: (button: GBAButton) => void
  onReleaseButton: (button: GBAButton) => void
  disableInput?: boolean
}

export function EmulatorCanvas({
  onInit,
  status,
  romName,
  keyBindings,
  onPressButton,
  onReleaseButton,
  disableInput = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)
  const pressedKeysRef = useRef<Set<string>>(new Set())
  const pressedGamepadButtonsRef = useRef<Set<GBAButton>>(new Set())
  const rafRef = useRef<number | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [gamepadConnected, setGamepadConnected] = useState(false)
  const [activeTouchButtons, setActiveTouchButtons] = useState<Set<GBAButton>>(new Set())

  useEffect(() => {
    if (canvasRef.current && !initialized.current) {
      initialized.current = true
      onInit(canvasRef.current)
    }
  }, [onInit])

  useEffect(() => {
    function normalizeKey(key: string) {
      return key.toLowerCase()
    }

    function findMappedButton(key: string) {
      const normalized = normalizeKey(key)
      return (Object.entries(keyBindings) as [GBAButton, string][]).find(
        ([, mapped]) => normalizeKey(mapped) === normalized
      )?.[0] ?? null
    }

    // Release all currently held keys when bindings change or input is disabled
    function releaseAllKeys() {
      pressedKeysRef.current.forEach((key) => {
        const button = findMappedButton(key)
        if (button) onReleaseButton(button)
      })
      pressedKeysRef.current.clear()
    }

    if (disableInput) {
      releaseAllKeys()
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return
      const target = event.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return

      const button = findMappedButton(event.key)
      if (!button) return
      if (pressedKeysRef.current.has(event.key)) return

      pressedKeysRef.current.add(event.key)
      onPressButton(button)
      event.preventDefault()
    }

    function onKeyUp(event: KeyboardEvent) {
      const button = findMappedButton(event.key)
      if (!button) return

      pressedKeysRef.current.delete(event.key)
      onReleaseButton(button)
      event.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      releaseAllKeys()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [disableInput, keyBindings, onPressButton, onReleaseButton])

  useEffect(() => {
    function getGamepadButtons(gamepad: Gamepad | null): Set<GBAButton> {
      const buttons = new Set<GBAButton>()
      if (!gamepad) return buttons

      gamepad.buttons.forEach((button, index) => {
        const mapped = GAMEPAD_BUTTON_MAP[index]
        if (mapped && button.pressed) {
          buttons.add(mapped)
        }
      })

      if (gamepad.axes.length >= 2) {
        const [x, y] = [gamepad.axes[0], gamepad.axes[1]]
        if (x < -GAMEPAD_AXIS_THRESHOLD) buttons.add('Left')
        if (x > GAMEPAD_AXIS_THRESHOLD) buttons.add('Right')
        if (y < -GAMEPAD_AXIS_THRESHOLD) buttons.add('Up')
        if (y > GAMEPAD_AXIS_THRESHOLD) buttons.add('Down')
      }

      return buttons
    }

    function syncGamepadState(current: Set<GBAButton>) {
      const previous = pressedGamepadButtonsRef.current
      current.forEach((button) => {
        if (!previous.has(button)) {
          onPressButton(button)
        }
      })
      previous.forEach((button) => {
        if (!current.has(button)) {
          onReleaseButton(button)
        }
      })
      pressedGamepadButtonsRef.current = current
    }

    function releaseAllGamepadButtons() {
      pressedGamepadButtonsRef.current.forEach((button) => onReleaseButton(button))
      pressedGamepadButtonsRef.current.clear()
    }

    function pollGamepad() {
      if (disableInput) {
        if (pressedGamepadButtonsRef.current.size > 0) {
          releaseAllGamepadButtons()
        }
        rafRef.current = requestAnimationFrame(pollGamepad)
        return
      }

      const gamepads = navigator.getGamepads?.() ?? []
      const connectedGamepad = Array.from(gamepads).find((pad): pad is Gamepad => !!pad && pad.connected) ?? null
      const connected = connectedGamepad !== null
      setGamepadConnected((prev) => (prev === connected ? prev : connected))
      const currentButtons = getGamepadButtons(connectedGamepad)
      syncGamepadState(currentButtons)
      rafRef.current = requestAnimationFrame(pollGamepad)
    }

    rafRef.current = requestAnimationFrame(pollGamepad)
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
      releaseAllGamepadButtons()
    }
  }, [disableInput, onPressButton, onReleaseButton])

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  const showOverlay = status === 'idle' || status === 'loading'

  function toggleTouchButton(button: GBAButton, pressed: boolean) {
    setActiveTouchButtons((current) => {
      const next = new Set(current)
      if (pressed) {
        next.add(button)
      } else {
        next.delete(button)
      }
      return next
    })

    if (pressed) {
      onPressButton(button)
    } else {
      onReleaseButton(button)
    }
  }

  const isPlaying = status === 'running' || status === 'paused'

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black"
      style={{ aspectRatio: '3/2' }}
    >
      {/* mGBA renders directly onto this canvas — must always be in the DOM */}
      <canvas
        ref={canvasRef}
        id="canvas"
        width={240}
        height={160}
        className="w-full h-full block"
        style={{ imageRendering: 'pixelated' }}
      />

      {showOverlay && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
          {status === 'loading' ? (
            <>
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-purple-300 text-sm">
                {romName ? `Carregando ${romName}...` : 'Inicializando...'}
              </span>
            </>
          ) : (
            <>
              <div className="text-4xl">🎮</div>
              <p className="text-gray-400 text-sm text-center px-4">
                Carregue uma ROM <span className="text-gray-500">(.gba)</span> para começar
              </p>
            </>
          )}
        </div>
      )}

      {status === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
          <span className="text-white text-2xl font-bold tracking-widest opacity-80">PAUSADO</span>
        </div>
      )}

      {isPlaying && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs text-gray-200 backdrop-blur-sm">
            {gamepadConnected ? 'Gamepad conectado' : 'Nenhum gamepad'}
          </div>

          <div className="absolute left-4 bottom-4 pointer-events-auto">
            <div className="grid grid-cols-3 gap-2 w-36 h-36">
              <div />
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault()
                  event.currentTarget.setPointerCapture(event.pointerId)
                  toggleTouchButton('Up', true)
                }}
                onPointerUp={(event) => {
                  event.preventDefault()
                  event.currentTarget.releasePointerCapture(event.pointerId)
                  toggleTouchButton('Up', false)
                }}
                onPointerCancel={(event) => {
                  event.preventDefault()
                  toggleTouchButton('Up', false)
                }}
                className={`rounded-full bg-white/10 text-white text-lg font-semibold transition ${
                  activeTouchButtons.has('Up') ? 'scale-95 bg-purple-500/90' : 'hover:bg-white/20'
                }`}
              >
                ↑
              </button>
              <div />
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault()
                  event.currentTarget.setPointerCapture(event.pointerId)
                  toggleTouchButton('Left', true)
                }}
                onPointerUp={(event) => {
                  event.preventDefault()
                  event.currentTarget.releasePointerCapture(event.pointerId)
                  toggleTouchButton('Left', false)
                }}
                onPointerCancel={(event) => {
                  event.preventDefault()
                  toggleTouchButton('Left', false)
                }}
                className={`rounded-full bg-white/10 text-white text-lg font-semibold transition ${
                  activeTouchButtons.has('Left') ? 'scale-95 bg-purple-500/90' : 'hover:bg-white/20'
                }`}
              >
                ←
              </button>
              <div className="bg-white/5 rounded-full" />
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault()
                  event.currentTarget.setPointerCapture(event.pointerId)
                  toggleTouchButton('Right', true)
                }}
                onPointerUp={(event) => {
                  event.preventDefault()
                  event.currentTarget.releasePointerCapture(event.pointerId)
                  toggleTouchButton('Right', false)
                }}
                onPointerCancel={(event) => {
                  event.preventDefault()
                  toggleTouchButton('Right', false)
                }}
                className={`rounded-full bg-white/10 text-white text-lg font-semibold transition ${
                  activeTouchButtons.has('Right') ? 'scale-95 bg-purple-500/90' : 'hover:bg-white/20'
                }`}
              >
                →
              </button>
              <div />
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault()
                  event.currentTarget.setPointerCapture(event.pointerId)
                  toggleTouchButton('Down', true)
                }}
                onPointerUp={(event) => {
                  event.preventDefault()
                  event.currentTarget.releasePointerCapture(event.pointerId)
                  toggleTouchButton('Down', false)
                }}
                onPointerCancel={(event) => {
                  event.preventDefault()
                  toggleTouchButton('Down', false)
                }}
                className={`rounded-full bg-white/10 text-white text-lg font-semibold transition ${
                  activeTouchButtons.has('Down') ? 'scale-95 bg-purple-500/90' : 'hover:bg-white/20'
                }`}
              >
                ↓
              </button>
            </div>
          </div>

          <div className="absolute right-4 bottom-6 pointer-events-auto flex flex-col items-end gap-2">
            {['A', 'B', 'L', 'R'].map((button) => (
              <button
                key={button}
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault()
                  event.currentTarget.setPointerCapture(event.pointerId)
                  toggleTouchButton(button as GBAButton, true)
                }}
                onPointerUp={(event) => {
                  event.preventDefault()
                  event.currentTarget.releasePointerCapture(event.pointerId)
                  toggleTouchButton(button as GBAButton, false)
                }}
                onPointerCancel={(event) => {
                  event.preventDefault()
                  toggleTouchButton(button as GBAButton, false)
                }}
                className={`w-14 h-14 rounded-full bg-white/10 text-white text-sm font-semibold transition ${
                  activeTouchButtons.has(button as GBAButton) ? 'scale-95 bg-purple-500/90' : 'hover:bg-white/20'
                }`}
              >
                {button}
              </button>
            ))}
            <div className="mt-2 flex gap-2">
              {(['Start', 'Select'] as GBAButton[]).map((button) => (
                <button
                  key={button}
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault()
                    event.currentTarget.setPointerCapture(event.pointerId)
                    toggleTouchButton(button, true)
                  }}
                  onPointerUp={(event) => {
                    event.preventDefault()
                    event.currentTarget.releasePointerCapture(event.pointerId)
                    toggleTouchButton(button, false)
                  }}
                  onPointerCancel={(event) => {
                    event.preventDefault()
                    toggleTouchButton(button, false)
                  }}
                  className={`px-3 py-2 rounded-full bg-white/10 text-white text-[11px] font-semibold transition ${
                    activeTouchButtons.has(button) ? 'scale-95 bg-purple-500/90' : 'hover:bg-white/20'
                  }`}
                >
                  {button}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen button — always visible on hover */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-2 right-2 p-1.5 rounded bg-black/50 text-gray-400 hover:text-white hover:bg-black/80 transition-all opacity-0 hover:opacity-100 [.group:hover_&]:opacity-100 focus:opacity-100"
        title={isFullscreen ? 'Sair do fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        )}
      </button>
    </div>
  )
}
