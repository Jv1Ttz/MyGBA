import { useCallback, useState } from 'react'
import { EmulatorCanvas } from './components/EmulatorCanvas'
import { ControlPanel } from './components/ControlPanel'
import { useEmulator } from './hooks/useEmulator'

export default function App() {
  const emulator = useEmulator()
  const [bindingMode, setBindingMode] = useState(false)

  const handleInit = useCallback(
    (canvas: HTMLCanvasElement) => emulator.init(canvas),
    [emulator.init]
  )

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="flex flex-col" style={{ maxWidth: '900px', width: '100%' }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🎮</span>
          <h1 className="text-white font-semibold tracking-wide">GBA Emulator</h1>
          <span className="ml-auto text-xs text-gray-600">powered by mGBA</span>
        </div>

        {/* Main layout: screen + bottom menu */}
        <div className="flex flex-col rounded-xl overflow-hidden border border-gray-800 shadow-2xl shadow-purple-900/20"
             style={{ minHeight: '520px' }}>
          {/* Screen — grows to fill available width */}
          <div className="flex-1 bg-black group">
            <EmulatorCanvas
              onInit={handleInit}
              status={emulator.status}
              romName={emulator.romName}
              keyBindings={emulator.keyBindings}
              onPressButton={emulator.pressButton}
              onReleaseButton={emulator.releaseButton}
              disableInput={bindingMode}
            />
          </div>

          {/* Control Panel bottom */}
          <ControlPanel
            status={emulator.status}
            romName={emulator.romName}
            volume={emulator.volume}
            speed={emulator.speed}
            keyBindings={emulator.keyBindings}
            onSetKeyBinding={emulator.setKeyBinding}
            onResetKeyBindings={emulator.resetKeyBindings}
            onBindingModeChange={setBindingMode}
            cheatStatus={emulator.cheatStatus}
            cheatFileName={emulator.cheatFileName}
            authEmail={emulator.authEmail}
            userEmail={emulator.userEmail}
            authMessage={emulator.authMessage}
            syncStatus={emulator.syncStatus}
            onAuthEmailChange={emulator.setAuthEmail}
            onSignIn={emulator.signInWithEmail}
            onSignOut={emulator.signOut}
            onRomSelected={emulator.loadRom}
            onUploadCheats={emulator.uploadCheats}
            onApplyCheatText={emulator.applyCheatText}
            onPause={emulator.pause}
            onResume={emulator.resume}
            onReset={emulator.reset}
            onQuit={emulator.quit}
            onSaveState={emulator.saveState}
            onLoadState={emulator.loadState}
            onVolumeChange={emulator.setVolume}
            onSpeedChange={emulator.setSpeed}
          />
        </div>
      </div>
    </div>
  )
}
