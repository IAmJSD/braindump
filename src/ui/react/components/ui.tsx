import React from "react";

export function UrgencyBadge({ urgency }: { urgency: number }) {
    const [label, cls] =
        urgency > 0.7 ? ["High", "bg-red-500/15 text-red-400"] :
        urgency > 0.4 ? ["Med",  "bg-yellow-500/15 text-yellow-400"] :
                        ["Low",  "bg-green-500/15 text-green-400"];
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${cls}`}>
            {label}
        </span>
    );
}

export function MoodBar({ mood }: { mood: number }) {
    const color = mood > 0.6 ? "bg-green-500" : mood > 0.3 ? "bg-yellow-500" : "bg-red-500";
    return (
        <div className="w-14 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.round(mood * 100)}%` }} />
        </div>
    );
}

export function EmptyState({ message }: { message: string }) {
    return <div className="flex items-center justify-center h-24 text-gray-400 dark:text-gray-600 text-xs">{message}</div>;
}

export function PanelLoader() {
    return <div className="flex items-center justify-center h-24 text-gray-300 dark:text-gray-700 text-xs">Loading…</div>;
}

export function FullScreenLoader() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center text-gray-300 dark:text-gray-700 text-sm">
            Loading…
        </div>
    );
}
