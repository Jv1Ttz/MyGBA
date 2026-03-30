import { useRef, useState, type DragEvent } from 'react'

interface Props {
  onRomSelected: (file: File) => void
  disabled?: boolean
}

export function RomLoader({ onRomSelected, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.gba')) return
    onRomSelected(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors
        ${disabled
          ? 'border-gray-700 text-gray-600 cursor-not-allowed'
          : dragging
            ? 'border-purple-400 bg-purple-500/10 text-purple-300'
            : 'border-gray-600 hover:border-purple-500 hover:bg-purple-500/10 text-gray-300 hover:text-purple-300'
        }
      `}
      onClick={() => !disabled && inputRef.current?.click()}
      title="Carregar ROM .gba"
    >
      <span>📂</span>
      <span>Carregar ROM</span>
      <input
        ref={inputRef}
        type="file"
        accept=".gba"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  )
}
