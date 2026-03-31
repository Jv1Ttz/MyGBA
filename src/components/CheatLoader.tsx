import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import type { CheatStatus } from '../hooks/useEmulator'

interface Props {
  onUploadCheats: (file: File) => boolean
  onApplyCheatText: (cheatText: string) => boolean
  disabled?: boolean
  status: CheatStatus
  fileName: string | null
}

const statusLabels: Record<CheatStatus, { text: string; color: string }> = {
  idle:        { text: 'Nenhum cheat carregado',           color: 'text-gray-500' },
  uploading:   { text: 'Carregando cheats...',             color: 'text-yellow-400' },
  loaded:      { text: '✓ Cheats aplicados',               color: 'text-green-400' },
  failed:      { text: '✗ Falha ao aplicar cheats',        color: 'text-red-400' },
  'no-cheats': { text: 'Nenhum cheat encontrado pro jogo', color: 'text-yellow-500' },
}

export function CheatLoader({ onUploadCheats, onApplyCheatText, disabled, status, fileName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [cheatText, setCheatText] = useState('')

  function handleFile(file: File) {
    if (disabled) return
    onUploadCheats(file)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function handleApply() {
    if (!cheatText.trim() || disabled) return
    const applied = onApplyCheatText(cheatText)
    if (applied) setCheatText('')
  }

  const { text: statusText, color: statusColor } = statusLabels[status]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-xs uppercase tracking-widest">Cheats / GameShark</span>
        <span className={`text-xs ${statusColor}`}>{statusText}</span>
      </div>

      {/* File upload */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
          disabled
            ? 'border-gray-700 text-gray-600 cursor-not-allowed'
            : dragging
              ? 'border-purple-400 bg-purple-500/10 text-purple-200'
              : 'border-gray-700 hover:border-purple-500 hover:bg-purple-500/10 text-gray-400 hover:text-purple-300'
        }`}
      >
        <span className="text-base">📄</span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-300">Carregar arquivo .cht</p>
          <p className="text-[11px] text-gray-600 truncate">
            {fileName ? `Carregado: ${fileName}` : 'Clique ou arraste um arquivo de cheats'}
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".cht,.cheats,.txt"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      {/* Manual code input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-gray-500">
          Ou cole códigos GameShark / Code Breaker — um por linha, nome opcional acima:
        </label>
        <div className="rounded-lg border border-gray-700 bg-gray-950 p-2 text-[11px] font-mono leading-relaxed space-y-1">
          <div className="text-gray-600">GameShark <span className="text-gray-700">(8+8)</span></div>
          <div className="text-gray-500">74000130 03F60065</div>
          <div className="text-gray-500">82003884 00640000</div>
          <div className="mt-1 text-gray-600">Code Breaker <span className="text-gray-700">(8+4)</span></div>
          <div className="text-gray-500">0000BE28 000A</div>
        </div>
        <textarea
          value={cheatText}
          onChange={(e) => setCheatText(e.target.value)}
          placeholder={'Infinite Money\n74000130 03F6A010\n82025840 00C0FFEE'}
          disabled={disabled}
          rows={5}
          className="w-full resize-none rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-xs text-gray-200 font-mono outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-40"
        />
      </div>

      <button
        type="button"
        onClick={handleApply}
        disabled={disabled || !cheatText.trim()}
        className="w-full py-2 rounded-lg text-xs font-medium bg-purple-700 hover:bg-purple-600 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Aplicar códigos
      </button>
    </div>
  )
}
