"use client"

import { useRef, useState } from "react"
import { ImagePlus, RefreshCw, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  value: string | null
  onChange: (dataUrl: string | null) => void
}

const ACCEPTED = ["image/png", "image/jpeg", "image/jpg"]

export function ScreenshotUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const readFile = (file: File) => {
    setError(null)
    if (!ACCEPTED.includes(file.type)) {
      setError("Only PNG and JPG images are supported.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") onChange(result)
    }
    reader.onerror = () => setError("Could not read the file.")
    reader.readAsDataURL(file)
  }

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) readFile(file)
    e.target.value = "" // allow re-selecting the same file
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) readFile(file)
  }

  const triggerPick = () => inputRef.current?.click()

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={onSelect}
        aria-label="Upload screenshot"
      />

      {value ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value || "/placeholder.svg"} alt="Trade screenshot" className="max-h-80 w-full object-contain" />
          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">Screenshot attached</span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={triggerPick}>
                <RefreshCw className="size-3.5" aria-hidden />
                Replace
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange(null)}
                className="text-red-400 hover:text-red-400"
              >
                <X className="size-3.5" aria-hidden />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={triggerPick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              triggerPick()
            }
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragOver
              ? "border-emerald-500/60 bg-emerald-500/10"
              : "border-border bg-card/40 hover:border-border/80 hover:bg-card/60"
          }`}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-muted/60">
            <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="text-sm font-medium">Drop a screenshot here, or click to upload</div>
          <div className="text-xs text-muted-foreground">PNG or JPG, up to 5 MB</div>
          <Button type="button" variant="outline" size="sm" className="mt-1">
            <Upload className="size-3.5" aria-hidden />
            Browse files
          </Button>
        </div>
      )}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
