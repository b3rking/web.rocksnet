import { Loader2 } from "lucide-react"

export function TableSpinner() {
    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-stone-950/50 backdrop-blur-[1px] transition-all duration-200">
            <Loader2 className="h-6 w-6 animate-spin text-stone-700 dark:text-stone-300" />
            <p className="text-xs font-medium text-muted-foreground animate-pulse">
                Chargement...
            </p>
        </div>
    )
}