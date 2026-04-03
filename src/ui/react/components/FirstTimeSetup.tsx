import React, { useState } from "react";
import { rpcMethods } from "../../rpc";
import type { AdapterInfo } from "../types";

export function FirstTimeSetup({
    adapters,
    onComplete,
}: {
    adapters: AdapterInfo[];
    onComplete: () => void;
}) {
    const [selected, setSelected] = useState<string | null>(null);
    const [token, setToken] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedAdapter = adapters.find(a => a.id === selected);

    const handleSubmit = async () => {
        if (!selected) return;
        setSaving(true);
        setError(null);
        try {
            await rpcMethods.setDefaultAdapter({ adapterId: selected, token: token || undefined });
            onComplete();
        } catch {
            setError("Failed to save. Please try again.");
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white flex items-center justify-center p-8">
            <div className="max-w-xl w-full">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Welcome to Braindump</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Choose an AI provider to get started.</p>
                </div>

                <div className="space-y-2 mb-6">
                    {adapters.map(adapter => (
                        <button
                            key={adapter.id}
                            onClick={() => { setSelected(adapter.id); setToken(""); setError(null); }}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                                selected === adapter.id
                                    ? "border-indigo-500 bg-indigo-500/10"
                                    : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <img src={adapter.iconUrl} alt="" className="w-8 h-8 rounded object-contain flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">{adapter.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{adapter.description}</div>
                                    {adapter.privacyNotes.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {adapter.privacyNotes.map((note, i) => (
                                                <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                                                    {note}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {selected === adapter.id && (
                                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                    {adapters.length === 0 && (
                        <div className="text-gray-400 dark:text-gray-600 text-sm py-4 text-center">No providers available.</div>
                    )}
                </div>

                {selectedAdapter?.tokenRequired && (
                    <div className="mb-6">
                        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">API token for {selectedAdapter.name}</label>
                        <input
                            type="password"
                            value={token}
                            onChange={e => setToken(e.target.value)}
                            placeholder="sk-…"
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                )}

                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                <button
                    onClick={handleSubmit}
                    disabled={!selected || saving || (!!selectedAdapter?.tokenRequired && !token.trim())}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
                >
                    {saving ? "Saving…" : "Get started"}
                </button>
            </div>
        </div>
    );
}
