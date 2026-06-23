"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Keyboard } from "lucide-react"
import type { ShortcutDef } from "@/hooks/use-keyboard-shortcuts"

interface KeyboardShortcutsDialogProps {
  shortcuts: ShortcutDef[]
  enabled: boolean
  onToggle: (enabled: boolean) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function formatShortcut(s: ShortcutDef): string {
  const parts: string[] = []
  if (s.ctrl) parts.push("Ctrl")
  if (s.alt) parts.push("Alt")
  if (s.shift) parts.push("Shift")
  const k = s.key
  parts.push(k === " " ? "Space" : k.length === 1 ? k.toUpperCase() : k)
  return parts.join(" + ")
}

export function KeyboardShortcutsDialog({ shortcuts, enabled, onToggle, open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const categories = Array.from(new Set(shortcuts.map((s) => s.category)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs sm:text-sm" aria-label="Keyboard shortcuts (press ? to open)">
          <Keyboard className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b">
          <Label htmlFor="shortcuts-toggle" className="text-sm font-medium">
            Keyboard shortcuts
          </Label>
          <Switch
            id="shortcuts-toggle"
            checked={enabled}
            onCheckedChange={onToggle}
            aria-label="Toggle keyboard shortcuts on or off"
          />
        </div>

        <div className="space-y-4 pt-2">
          {categories.map((category) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{category}</h4>
              <div className="space-y-1">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((s) => (
                    <div key={s.label} className="flex items-center justify-between py-1 gap-4">
                      <span className="text-sm">{s.description}</span>
                      <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border rounded whitespace-nowrap flex-shrink-0" aria-keyshortcuts={formatShortcut(s)}>
                        {formatShortcut(s)}
                      </kbd>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
