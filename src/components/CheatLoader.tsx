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

function normalizeHex(value: string) {
  return value.trim().replace(/^0x/i, '').toUpperCase()
}

function isHex(value: string) {
  return /^[0-9A-F]+$/.test(value)
}

function pad(value: string, length: number) {
  return value.padStart(length, '0')
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
  const [address, setAddress] = useState('')
  const [value, setValue] = useState('')
  const [size, setSize] = useState<'8' | '16'>('8')
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([])
  const [builderError, setBuilderError] = useState<string | null>(null)

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

  function buildCodeLine() {
    const normalizedAddress = normalizeHex(address)
    const normalizedValue = normalizeHex(value)

    if (!normalizedAddress || !normalizedValue) {
      setBuilderError('Endereço e valor são obrigatórios.')
      return null
    }

    if (!isHex(normalizedAddress) || !isHex(normalizedValue)) {
      setBuilderError('Use apenas caracteres hexadecimais (0-9, A-F).')
      return null
    }

    const addressValue = parseInt(normalizedAddress, 16)
    if (Number.isNaN(addressValue)) {
      setBuilderError('Endereço inválido.')
      return null
    }

    const lineAddress = pad(normalizedAddress, 6)
    const hexValue = size === '8' ? pad(normalizedValue, 2) : pad(normalizedValue, 4)
    const prefix = size === '8' ? '30' : '00'

    setBuilderError(null)
    return `${prefix}${lineAddress} ${hexValue}`
  }

  function handleGenerateCode() {
    if (disabled) return
    const code = buildCodeLine()
    if (!code) return

    setGeneratedCodes((current) => [...current, code])
    setCheatText((current) => (current ? `${current}\n${code}` : code))
  }

  function handleClearBuilder() {
    setAddress('')
    setValue('')
    setSize('8')
    setGeneratedCodes([])
    setBuilderError(null)
  }

  function handleApply() {
    if (!cheatText.trim() || disabled) return
    const applied = onApplyCheatText(cheatText)
    if (applied) {
      setCheatText('')
      setGeneratedCodes([])
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-gray-500 text-xs uppercase tracking-widest">Cheats</span>

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
        <div>
          <label className="block text-[11px] text-gray-400 mb-1">Endereço</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex: 0201ABCD"
            disabled={disabled}
            className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-200 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div>
          <label className="block text-[11px] text-gray-400 mb-1">Valor</label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ex: FF ou 1234"
            disabled={disabled}
            className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-200 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-gray-400">Tamanho:</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as '8' | '16')}
            disabled={disabled}
            className="rounded-lg border border-gray-800 bg-gray-950 px-2 py-2 text-xs text-gray-200 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="8">8-bit</option>
            <option value="16">16-bit</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleGenerateCode}
          disabled={disabled}
          className="rounded-lg bg-purple-700 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Gerar código
        </button>
      </div>

      {builderError && (
        <p className="text-xs text-red-400">{builderError}</p>
      )}

      {generatedCodes.length > 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-950 p-3 text-xs text-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-100">Códigos gerados</span>
            <button
              type="button"
              onClick={handleClearBuilder}
              disabled={disabled}
              className="text-xs text-purple-300 hover:text-white"
            >
              Limpar
            </button>
          </div>
          <div className="space-y-1">
            {generatedCodes.map((code, index) => (
              <div key={index} className="rounded bg-gray-900 px-2 py-1 font-mono text-[11px] text-gray-200">
                {code}
              </div>
            ))}
          </div>
        </div>
      )}

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
          onClick={() => {
            setCheatText('')
            setGeneratedCodes([])
          }}
          disabled={disabled}
          className="flex-1 py-2 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Limpar texto
        </button>
      </div>
    </div>
  )
}
