import { useTheme } from "#components/ThemeProvider"
import { Button } from "#components/ui/button"
import { IconSun, IconMoon } from "@tabler/icons-react"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle Theme"
        >
            {theme === "dark" ? (
                <IconSun className="h-5 w-5 text-amber-500 transition-all" />
            ) : (
                <IconMoon className="h-5 w-5 text-stone-700 transition-all" />
            )}
        </Button>
    )
}