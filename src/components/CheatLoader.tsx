import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import type { CheatStatus } from '../hooks/useEmulator'

interface Props {
  onUploadCheats: (file: File) => boolean
  onApplyCheatText: (cheatText: string) => boolean
  disabled?: boolean
  status: CheatStatus
  fileName: string | null
}

const statusLabels: Record<CheatStatus, string> = {
  idle: 'Nenhum cheat carregado',
  uploading: 'Carregando cheats...',
  loaded: 'Cheats aplicados',
  failed: 'Falha ao aplicar cheats',
  'no-cheats': 'Nenhum cheat encontrado para o jogo',
}

export function CheatLoader({
  onUploadCheats,
  onApplyCheatText,
  disabled,
  status,
  fileName,
}: Props) {
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

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (disabled) return
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleApply() {
    if (!cheatText.trim() || disabled) return
    const applied = onApplyCheatText(cheatText)
    if (applied) {
      setCheatText('')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-gray-500 text-xs uppercase tracking-widest">Cheats</span>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-colors text-sm cursor-pointer ${
          disabled
            ? 'border-gray-700 bg-gray-900 text-gray-500 cursor-not-allowed'
            : dragging
              ? 'border-purple-400 bg-purple-500/10 text-purple-200'
              : 'border-gray-600 bg-gray-950 text-gray-300 hover:border-purple-500 hover:bg-purple-500/10 hover:text-purple-200'
        }`}
        title="Carregar arquivo de cheats"
      >
        <div className="flex items-center gap-2">
          <span>📄</span>
          <div>
            <p className="text-xs font-medium">Upload de cheats</p>
            <p className="text-[11px] text-gray-500">Solte um arquivo .cht ou clique para carregar</p>
          </div>
        </div>
        <span className="text-xs text-gray-400">{statusLabels[status]}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".cht,.txt,.cheat"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      {fileName && (
        <p className="text-xs text-gray-500 truncate" title={fileName}>
          Arquivo carregado: {fileName}
        </p>
      )}

      <textarea
        value={cheatText}
        onChange={(e) => setCheatText(e.target.value)}
        placeholder="Cole aqui códigos GameShark e pressione Aplicar"
        disabled={disabled}
        className="w-full min-h-[96px] resize-none rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-200 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleApply}
          disabled={disabled || !cheatText.trim()}
          className="flex-1 py-2 rounded-lg text-xs font-medium bg-purple-700 hover:bg-purple-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Aplicar códigos
        </button>
        <button
          type="button"
          onClick={() => setCheatText('')}
          disabled={disabled}
          className="flex-1 py-2 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Limpar texto
        </button>
      </div>
    </div>
  )
}
