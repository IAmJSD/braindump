import React from "react";
import useRpc from "../hooks/useRpc";
import { formatDate } from "../utils";
import { MoodBar, EmptyState } from "./ui";

export function LandmarkPanel({ cacheKey }: { cacheKey: unknown }) {
    const thoughts = useRpc("getLandmarkThoughts", [], cacheKey, undefined);

    if (thoughts.length === 0) return <EmptyState message="No landmark thoughts yet" />;

    return (
        <div className="p-3 space-y-2">
            {thoughts.map(thought => (
                <div key={thought.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-transparent rounded-xl p-3">
                    <p className="text-gray-900 dark:text-white text-sm leading-relaxed">{thought.content}</p>
                    {thought.aiSummary && thought.aiSummary !== thought.content && (
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-2 italic line-clamp-2">{thought.aiSummary}</p>
                    )}
                    <div className="flex items-center justify-between mt-2.5">
                        <span className="text-gray-400 dark:text-gray-600 text-xs">{formatDate(thought.createdAt)}</span>
                        <MoodBar mood={thought.mood} />
                    </div>
                </div>
            ))}
        </div>
    );
}
