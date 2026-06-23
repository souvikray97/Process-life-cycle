"use client"

import { useEffect, useCallback } from "react"

export interface ShortcutAction {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  label: string
  description: string
  category: string
  action: () => void
}

// Display-only variant — no action needed for the shortcuts dialog
export type ShortcutDef = Omit<ShortcutAction, "action">

function isInteractiveFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  if (tag === "input" || tag === "textarea" || tag === "select") return true
  if ((el as HTMLElement).isContentEditable) return true
  // Prevent Space/Enter shortcuts from doubling with focused buttons/links
  if (tag === "button" || tag === "a") return true
  if ((el as HTMLElement).getAttribute("role") === "button") return true
  return false
}

export function useKeyboardShortcuts(shortcuts: ShortcutAction[], enabled: boolean) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return
      if (isInteractiveFocused()) return

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey)
        const altMatch = shortcut.alt ? e.altKey : !e.altKey
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
        const keyMatch = e.key === shortcut.key || e.key.toLowerCase() === shortcut.key.toLowerCase()

        if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
          e.preventDefault()
          shortcut.action()
          return
        }
      }
    },
    [shortcuts, enabled],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])
}

export function useShortcutsEnabled() {
  return { shortcutsEnabled: true, setShortcutsEnabled: (_: boolean) => {} }
}
