import React, { useState } from "react";
import { rpcMethods } from "../../rpc";
import useRpc from "../hooks/useRpc";
import { formatDate } from "../utils";
import { UrgencyBadge, EmptyState } from "./ui";

export function TasksPanel({ cacheKey, onRefresh }: { cacheKey: unknown; onRefresh: () => void }) {
    const tasks = useRpc("getTasks", [], cacheKey, undefined);
    const [completing, setCompleting] = useState<number | null>(null);

    const handleComplete = async (id: number) => {
        setCompleting(id);
        try {
            await rpcMethods.completeTask({ id });
            onRefresh();
        } finally {
            setCompleting(null);
        }
    };

    if (tasks.length === 0) return <EmptyState message="No pending tasks" />;

    return (
        <div className="p-3 space-y-2">
            {tasks.map(task => (
                <div key={task.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-transparent rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                        <span className="text-gray-900 dark:text-white text-sm font-medium leading-snug">{task.title}</span>
                        <UrgencyBadge urgency={task.urgency} />
                    </div>
                    {task.description && (
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                        {task.startDate
                            ? <span className="text-gray-400 dark:text-gray-600 text-xs">{formatDate(task.startDate)}</span>
                            : <span />
                        }
                        <button
                            onClick={() => handleComplete(task.id)}
                            disabled={completing === task.id}
                            className="text-xs text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400 disabled:opacity-40 transition-colors flex items-center gap-1"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            {completing === task.id ? "…" : "Done"}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
