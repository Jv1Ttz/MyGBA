import { useEffect, useRef, useState, useCallback } from 'react'
import type { EmulatorStatus } from '../hooks/useEmulator'

interface Props {
  onInit: (canvas: HTMLCanvasElement) => void
  status: EmulatorStatus
  romName: string | null
}

export function EmulatorCanvas({ onInit, status, romName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (canvasRef.current && !initialized.current) {
      initialized.current = true
      onInit(canvasRef.current)
    }
  }, [onInit])

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
