import { useRef, useState, useCallback, useEffect } from 'react'
import mGBA from '@thenick775/mgba-wasm'
import { supabase, supabaseConfigured } from '../lib/supabaseClient'

type mGBAEmulator = Awaited<ReturnType<typeof mGBA>>

type SyncStatus = 'idle' | 'syncing' | 'ready' | 'error'

export type EmulatorStatus = 'idle' | 'loading' | 'running' | 'paused'
export type CheatStatus = 'idle' | 'uploading' | 'loaded' | 'failed' | 'no-cheats'
export type GBAButton = 'A' | 'B' | 'L' | 'R' | 'Start' | 'Select' | 'Up' | 'Down' | 'Left' | 'Right'

const defaultKeyBindings: Record<GBAButton, string> = {
  A: 'z',
  B: 'x',
  L: 'q',
  R: 's',
  Start: 'Enter',
  Select: 'Shift',
  Up: 'ArrowUp',
  Down: 'ArrowDown',
  Left: 'ArrowLeft',
  Right: 'ArrowRight',
}

export function useEmulator() {
  const moduleRef = useRef<mGBAEmulator | null>(null)
  const [status, setStatus] = useState<EmulatorStatus>('idle')
  const [romName, setRomName] = useState<string | null>(null)
  const [volume, setVolumeState] = useState(1.0)
  const [speed, setSpeedState] = useState(1)
  const [cheatStatus, setCheatStatus] = useState<CheatStatus>('idle')
  const [cheatFileName, setCheatFileName] = useState<string | null>(null)
  const [cheatFileUploaded, setCheatFileUploaded] = useState(false)
  const [keyBindings, setKeyBindings] = useState<Record<GBAButton, string>>(defaultKeyBindings)
  const [authEmail, setAuthEmail] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [authMessage, setAuthMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = window.localStorage.getItem('gbaKeyBindings')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<GBAButton, string>
        setKeyBindings({ ...defaultKeyBindings, ...parsed })
      } catch {
        setKeyBindings(defaultKeyBindings)
      }
    }

    if (!supabaseConfigured) return

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null
      if (user) {
        setUserEmail(user.email ?? null)
        setAuthMessage('Usuário conectado')
        loadRemoteBindings(user.id)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      if (user) {
        setUserEmail(user.email ?? null)
        setAuthMessage('Usuário conectado')
        loadRemoteBindings(user.id)
      } else {
        setUserEmail(null)
        setAuthMessage('Conecte-se para sincronizar')
      }
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  const persistBindings = useCallback((bindings: Record<GBAButton, string>) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('gbaKeyBindings', JSON.stringify(bindings))

    if (!supabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null
      if (!user) return
      setSyncStatus('syncing')
      supabase
        .from('gba_user_settings')
        .upsert({ user_id: user.id, key_bindings: bindings }, { onConflict: 'user_id' })
        .then(({ error }) => {
          if (error) {
            setSyncStatus('error')
            setAuthMessage('Erro ao sincronizar preferências')
          } else {
            setSyncStatus('ready')
          }
        })
    })
  }, [])

  const loadRemoteBindings = useCallback(
    async (userId: string) => {
      if (!supabaseConfigured) return
      setSyncStatus('syncing')
      const { data, error } = await supabase
        .from('gba_user_settings')
        .select('key_bindings')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        setSyncStatus('error')
        setAuthMessage('Erro ao carregar preferências remotas')
        return
      }

      if (data?.key_bindings) {
        const merged = { ...defaultKeyBindings, ...data.key_bindings }
        setKeyBindings(merged)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('gbaKeyBindings', JSON.stringify(merged))
        }
      }
      setSyncStatus('ready')
      setAuthMessage('Preferências sincronizadas')
    },
    []
  )

  const signInWithEmail = useCallback(async () => {
    if (!supabaseConfigured || !authEmail.trim()) {
      setAuthMessage('Supabase não configurado ou email inválido')
      return
    }

    setAuthMessage('Enviando link mágico...')
    const { error } = await supabase.auth.signInWithOtp({ email: authEmail.trim() })
    if (error) {
      setAuthMessage('Falha ao enviar link mágico')
      return
    }
    setAuthMessage('Verifique seu email para concluir o login')
  }, [authEmail])

  const signOut = useCallback(async () => {
    if (!supabaseConfigured) return
    await supabase.auth.signOut()
    setUserEmail(null)
    setSyncStatus('idle')
    setAuthMessage('Desconectado')
  }, [])

  const init = useCallback(async (canvas: HTMLCanvasElement) => {
    if (moduleRef.current) return
    setStatus('loading')
    const module = await mGBA({ canvas })
    await module.FSInit()
    moduleRef.current = module
    setStatus('idle')
  }, [])

  const uploadCheats = useCallback((file: File) => {
    const module = moduleRef.current
    if (!module) return false

    setCheatStatus('uploading')
    module.uploadCheats(file, () => {
      setCheatFileName(file.name)
      setCheatFileUploaded(true)

      if (module.gameName) {
        const loaded = module.autoLoadCheats()
        setCheatStatus(loaded ? 'loaded' : 'no-cheats')
      } else {
        setCheatStatus('idle')
      }
    })

    return true
  }, [])

  const applyCheatText = useCallback(
    (cheatText: string) => {
      if (!cheatText.trim()) return false

      const cheatFile = new File([cheatText.trim()], 'manual-cheats.cht', {
        type: 'text/plain',
      })
      return uploadCheats(cheatFile)
    },
    [uploadCheats]
  )

  const loadRom = useCallback(
    (file: File) => {
      const module = moduleRef.current
      if (!module) return

      setStatus('loading')
      module.uploadRom(file, () => {
        const paths = module.filePaths()
        const romPath = `${paths.gamePath}/${file.name}`
        const loaded = module.loadGame(romPath)
        if (loaded) {
          setRomName(file.name.replace(/\.gba$/i, ''))
          if (cheatFileUploaded) {
            const cheatsLoaded = module.autoLoadCheats()
            setCheatStatus(cheatsLoaded ? 'loaded' : 'no-cheats')
          }
          setStatus('running')
        } else {
          setStatus('idle')
        }
      })
    },
    [cheatFileUploaded]
  )

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
    setCheatFileName(null)
    setCheatFileUploaded(false)
    setCheatStatus('idle')
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

  const pressButton = useCallback((button: GBAButton) => {
    moduleRef.current?.buttonPress(button)
  }, [])

  const releaseButton = useCallback((button: GBAButton) => {
    moduleRef.current?.buttonUnpress(button)
  }, [])

  const setKeyBinding = useCallback(
    (button: GBAButton, key: string) => {
      const next = { ...keyBindings, [button]: key }
      setKeyBindings(next)
      persistBindings(next)
    },
    [keyBindings, persistBindings]
  )

  const resetKeyBindings = useCallback(() => {
    setKeyBindings(defaultKeyBindings)
    persistBindings(defaultKeyBindings)
  }, [persistBindings])

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
    uploadCheats,
    applyCheatText,
    pressButton,
    releaseButton,
    keyBindings,
    setKeyBinding,
    resetKeyBindings,
    cheatStatus,
    cheatFileName,
    status,
    romName,
    volume,
    speed,
    authEmail,
    setAuthEmail,
    userEmail,
    authMessage,
    syncStatus,
    supabaseConfigured,
    signInWithEmail,
    signOut,
  }
}
