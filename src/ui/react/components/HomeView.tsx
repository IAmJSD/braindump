import React, { Suspense, useState } from "react";
import { rpcMethods } from "../../rpc";
import type { Tab } from "../types";
import { PanelLoader } from "./ui";
import { TasksPanel } from "./TasksPanel";
import { LandmarkPanel } from "./LandmarkPanel";
import { SuicidePreventionScreen } from "./SuicidePreventionScreen";

export function HomeView({ dataVersion, onRefresh }: { dataVersion: number; onRefresh: () => void }) {
    const [thought, setThought] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [justSubmitted, setJustSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showSuicideScreen, setShowSuicideScreen] = useState(false);
    const [tab, setTab] = useState<Tab>("tasks");

    const handleSubmit = async () => {
        const trimmed = thought.trim();
        if (!trimmed || submitting) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const result = await rpcMethods.submitThought({ content: trimmed });
            setThought("");
            onRefresh();
            if (result.suicidal) {
                setShowSuicideScreen(true);
            } else {
                setJustSubmitted(true);
                setTimeout(() => setJustSubmitted(false), 2000);
            }
        } catch (e) {
            setSubmitError(e instanceof Error ? e.message : String(e));
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (showSuicideScreen) {
        return <SuicidePreventionScreen onDismiss={() => setShowSuicideScreen(false)} />;
    }

    if (submitError) {
        return (
            <div className="h-full bg-white dark:bg-gray-950 flex items-center justify-center p-8">
                <div className="max-w-md w-full text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-5">
                        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6 font-mono break-all">{submitError}</p>
                    <button
                        onClick={() => setSubmitError(null)}
                        className="px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl text-gray-900 dark:text-white text-sm font-medium transition-colors"
                    >
                        Go back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex overflow-hidden">
            {/* Left: thought input */}
            <div className="flex-1 flex flex-col p-8 min-w-0">
                <textarea
                    value={thought}
                    onChange={e => setThought(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What's on your mind?"
                    className="flex-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-lg resize-none focus:outline-none focus:border-gray-300 dark:focus:border-gray-700 leading-relaxed transition-colors"
                    autoFocus
                />
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-300 dark:text-gray-700 select-none">⌘ Return to submit</span>
                    <button
                        onClick={handleSubmit}
                        disabled={!thought.trim() || submitting}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-sm font-medium transition-colors"
                    >
                        {submitting ? "…" : justSubmitted ? "Saved ✓" : "Submit"}
                    </button>
                </div>
            </div>

            {/* Right: Tasks / Landmarks panel */}
            <div className="w-80 xl:w-96 border-l border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-gray-900 flex-shrink-0">
                <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1 gap-0.5">
                        {(["tasks", "landmark"] as Tab[]).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                                    tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                }`}
                            >
                                {t === "tasks" ? "Tasks" : "Landmarks"}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <Suspense fallback={<PanelLoader />}>
                        {tab === "tasks"
                            ? <TasksPanel cacheKey={dataVersion} onRefresh={onRefresh} />
                            : <LandmarkPanel cacheKey={dataVersion} />
                        }
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
