import { useRef, useState, useCallback } from 'react'
import mGBA from '@thenick775/mgba-wasm'

type mGBAEmulator = Awaited<ReturnType<typeof mGBA>>

export type EmulatorStatus = 'idle' | 'loading' | 'running' | 'paused'

export function useEmulator() {
  const moduleRef = useRef<mGBAEmulator | null>(null)
  const [status, setStatus] = useState<EmulatorStatus>('idle')
  const [romName, setRomName] = useState<string | null>(null)
  const [volume, setVolumeState] = useState(1.0)
  const [speed, setSpeedState] = useState(1)

  const init = useCallback(async (canvas: HTMLCanvasElement) => {
    if (moduleRef.current) return
    setStatus('loading')
    const module = await mGBA({ canvas })
    await module.FSInit()
    moduleRef.current = module
    setStatus('idle')
  }, [])

  const loadRom = useCallback((file: File) => {
    const module = moduleRef.current
    if (!module) return

    setStatus('loading')
    module.uploadRom(file, () => {
      const paths = module.filePaths()
      const romPath = `${paths.gamePath}/${file.name}`
      const loaded = module.loadGame(romPath)
      if (loaded) {
        setRomName(file.name.replace(/\.gba$/i, ''))
        setStatus('running')
      } else {
        setStatus('idle')
      }
    })
  }, [])

  const pause = useCallback(() => {
    moduleRef.current?.pauseGame()
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    moduleRef.current?.resumeGame()
    setStatus('running')
  }, [])

  const reset = useCallback(() => {
    moduleRef.current?.quickReload()
    setStatus('running')
  }, [])

  const quit = useCallback(() => {
    moduleRef.current?.quitGame()
    setRomName(null)
    setStatus('idle')
  }, [])

  const saveState = useCallback((slot: number) => {
    return moduleRef.current?.saveState(slot) ?? false
  }, [])

  const loadState = useCallback((slot: number) => {
    return moduleRef.current?.loadState(slot) ?? false
  }, [])

  const setVolume = useCallback((percent: number) => {
    moduleRef.current?.setVolume(percent)
    setVolumeState(percent)
  }, [])

  const setSpeed = useCallback((multiplier: number) => {
    moduleRef.current?.setFastForwardMultiplier(multiplier)
    setSpeedState(multiplier)
  }, [])

  const screenshot = useCallback(() => {
    moduleRef.current?.screenshot()
  }, [])

  return {
    init,
    loadRom,
    pause,
    resume,
    reset,
    quit,
    saveState,
    loadState,
    setVolume,
    setSpeed,
    screenshot,
    status,
    romName,
    volume,
    speed,
  }
}
