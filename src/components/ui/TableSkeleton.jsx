const TableSkeleton = () => {
    return (
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden animate-pulse">
            {/* En-tête de la table simulé */}
            <div className="border-b bg-stone-50/50 dark:bg-stone-900/50 px-6 py-3.5 flex items-center justify-between gap-4">
                <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-1/12" />
                <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-3/12" />
                <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-2/12" />
                <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-2/12" />
                <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-1/12" />
            </div>

            {/* Lignes de la table simulées (5 lignes pour un effet réaliste) */}
            <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="px-6 py-4 flex items-center justify-between gap-4">
                        {/* Colonne Nom */}
                        <div className="h-5 bg-stone-200/70 dark:bg-stone-800/70 rounded w-1/12" />
                        {/* Colonne Email */}
                        <div className="h-4 bg-stone-200/60 dark:bg-stone-800/60 rounded w-3/12" />
                        {/* Colonne Date */}
                        <div className="h-4 bg-stone-200/60 dark:bg-stone-800/60 rounded w-2/12" />
                        {/* Colonne Badge Rôle */}
                        <div className="h-6 bg-stone-200/80 dark:bg-stone-800/80 rounded-full w-2/12 max-w-[80px]" />
                        {/* Colonne Actions (Boutons) */}
                        <div className="flex gap-2 w-1/12 justify-end">
                            <div className="h-8 bg-stone-200/70 dark:bg-stone-800/70 rounded w-12" />
                            <div className="h-8 bg-stone-200/70 dark:bg-stone-800/70 rounded w-16" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Barre de pagination simulée en bas */}
            <div className="border-t px-6 py-4 flex items-center justify-between">
                <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded w-24" />
                <div className="flex gap-2">
                    <div className="h-8 w-8 bg-stone-200 dark:bg-stone-800 rounded" />
                    <div className="h-8 w-8 bg-stone-200 dark:bg-stone-800 rounded" />
                </div>
            </div>
        </div>
    )
}

export default TableSkeleton