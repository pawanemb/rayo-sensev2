"use client"

import { useCallback, useRef } from "react"
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"

import { cn } from "@/lib/utils"
import { useTheme } from "@/context/ThemeContext"

interface AnimatedThemeTogglerProps
  extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) => {
  const { theme, toggleTheme: contextToggleTheme } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return

    // Check if View Transition API is supported
    if (!document.startViewTransition) {
      // Fallback for browsers that don't support View Transition API
      contextToggleTheme()
      return
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        contextToggleTheme()
      })
    }).ready

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }, [contextToggleTheme, duration])

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
        "text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
        className
      )}
      aria-label="Toggle theme"
      {...props}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
