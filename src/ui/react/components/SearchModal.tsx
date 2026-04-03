import React, { useEffect, useRef, useState } from "react";
import { rpcMethods } from "../../rpc";
import { formatDate } from "../utils";
import { UrgencyBadge, MoodBar } from "./ui";

type Results = Awaited<ReturnType<typeof rpcMethods.search>>;

export function SearchModal({ onClose }: { onClose: () => void }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Results | null>(null);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (!dialog.open) dialog.showModal();

        const handleCancel = (event: Event) => {
            event.preventDefault();
            onClose();
        };

        dialog.addEventListener("cancel", handleCancel);
        return () => {
            dialog.removeEventListener("cancel", handleCancel);
            if (dialog.open) dialog.close();
        };
    }, [onClose]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const runSearch = (q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!q.trim()) { setResults(null); return; }
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const r = await rpcMethods.search({ query: q.trim() });
                setResults(r);
            } finally {
                setSearching(false);
            }
        }, 400);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        runSearch(e.target.value);
    };

    const total = (results?.thoughts.length ?? 0) + (results?.events.length ?? 0);

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="search-modal-title"
            className="m-0 p-0 border-none bg-transparent max-w-none max-h-none w-screen h-screen overflow-visible backdrop:bg-black/60 backdrop:backdrop-blur-sm"
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="w-full h-full flex items-start justify-center pt-24 px-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[60vh]" onClick={e => e.stopPropagation()}>
                {/* Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                    <h2 id="search-modal-title" className="sr-only">Search thoughts and events</h2>
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input
                        autoFocus
                        type="text"
                        value={query}
                        onChange={handleChange}
                        placeholder="Search thoughts and events…"
                        className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none"
                    />
                    {searching && (
                        <span className="text-xs text-gray-400 dark:text-gray-600">Searching…</span>
                    )}
                    {!searching && results && (
                        <span className="text-xs text-gray-400 dark:text-gray-600">{total} result{total !== 1 ? "s" : ""}</span>
                    )}
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Close search"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Results */}
                <div className="overflow-y-auto flex-1">
                    {!query.trim() && (
                        <div className="flex items-center justify-center h-24 text-gray-400 dark:text-gray-600 text-xs">
                            Type to search
                        </div>
                    )}

                    {results && total === 0 && !searching && (
                        <div className="flex items-center justify-center h-24 text-gray-400 dark:text-gray-600 text-xs">
                            No results
                        </div>
                    )}

                    {results && (results.thoughts.length > 0 || results.events.length > 0) && (
                        <div className="p-3 space-y-4">
                            {results.thoughts.length > 0 && (
                                <section>
                                    <div className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wider font-medium px-1 mb-2">Thoughts</div>
                                    <div className="space-y-1.5">
                                        {results.thoughts.map(t => (
                                            <div key={t.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {t.landmark && (
                                                        <span className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">Landmark</span>
                                                    )}
                                                    <span className="text-gray-400 dark:text-gray-600 text-xs ml-auto">{formatDate(t.createdAt)}</span>
                                                </div>
                                                <p className="text-gray-900 dark:text-white text-sm leading-relaxed line-clamp-3">{t.content}</p>
                                                {t.aiSummary && t.aiSummary !== t.content && (
                                                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1.5 italic line-clamp-2">{t.aiSummary}</p>
                                                )}
                                                <div className="mt-2 flex justify-end">
                                                    <MoodBar mood={t.mood} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {results.events.length > 0 && (
                                <section>
                                    <div className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wider font-medium px-1 mb-2">Events</div>
                                    <div className="space-y-1.5">
                                        {results.events.map(e => (
                                            <div key={e.id} className={`bg-gray-50 dark:bg-gray-800 rounded-xl p-3 ${e.completed ? "opacity-50" : ""}`}>
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="text-gray-900 dark:text-white text-sm font-medium leading-snug">{e.title}</span>
                                                    <UrgencyBadge urgency={e.urgency} />
                                                </div>
                                                {e.description && (
                                                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 line-clamp-2">{e.description}</p>
                                                )}
                                                <div className="flex items-center justify-between mt-2">
                                                    {e.startDate && (
                                                        <span className="text-gray-400 dark:text-gray-600 text-xs">{formatDate(e.startDate)}</span>
                                                    )}
                                                    {e.completed && (
                                                        <span className="text-xs text-green-600 ml-auto">Done</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>
            </div>
        </dialog>
    );
}
