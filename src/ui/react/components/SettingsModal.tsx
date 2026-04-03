import React, { Suspense, useEffect, useRef, useState } from "react";
import { rpcMethods } from "../../rpc";
import useRpc from "../hooks/useRpc";
import type { SettingsView } from "../types";

export function SettingsModal({ onClose }: { onClose: () => void }) {
    const dialogRef = useRef<HTMLDialogElement>(null);

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

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="settings-modal-title"
            className="m-0 p-0 border-none bg-transparent max-w-none max-h-none w-screen h-screen overflow-visible backdrop:bg-black/60 backdrop:backdrop-blur-sm"
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="w-full h-full flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                    <Suspense fallback={<div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">Loading…</div>}>
                        <SettingsContent onClose={onClose} />
                    </Suspense>
                </div>
            </div>
        </dialog>
    );
}

function SettingsContent({ onClose }: { onClose: () => void }) {
    const [settingsVersion, setSettingsVersion] = useState(0);
    const adaptersData = useRpc("getAdapters", { adapters: [], default: null, defaultModel: null }, settingsVersion, undefined);

    const currentAdapter = adaptersData.adapters.find(a => a.id === adaptersData.default);
    const savedModelId = adaptersData.defaultModel ?? (currentAdapter?.defaultModelId ?? null);

    const [view, setView] = useState<SettingsView>("main");
    const [optimisticModel, setOptimisticModel] = useState<string | null>(null);
    const activeModelId = optimisticModel ?? savedModelId;
    const [selectedProvider, setSelectedProvider] = useState<string | null>(adaptersData.default);
    const [providerToken, setProviderToken] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedProviderInfo = adaptersData.adapters.find(a => a.id === selectedProvider);

    const handleModelSelect = async (modelId: string) => {
        setOptimisticModel(modelId);
        await rpcMethods.setDefaultModel({ modelId });
    };

    const handleProviderSave = async () => {
        if (!selectedProvider) return;
        if (selectedProviderInfo?.tokenRequired && !selectedProviderInfo.hasToken && !providerToken.trim()) {
            setError("An API token is required for this provider.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await rpcMethods.setDefaultAdapter({
                adapterId: selectedProvider,
                token: providerToken || undefined,
            });
            // Reset model to the new provider's default
            await rpcMethods.setDefaultModel({ modelId: selectedProviderInfo!.defaultModelId });
            setOptimisticModel(selectedProviderInfo!.defaultModelId);
            setSettingsVersion(v => v + 1);
            setView("main");
        } catch {
            setError("Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (view === "provider") {
        return (
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => { setView("main"); setError(null); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Change provider</h2>
                </div>

                <div className="space-y-2 mb-5">
                    {adaptersData.adapters.map(adapter => (
                        <button
                            key={adapter.id}
                            onClick={() => { setSelectedProvider(adapter.id); setProviderToken(""); setError(null); }}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${
                                selectedProvider === adapter.id
                                    ? "border-indigo-500 bg-indigo-500/10"
                                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <img src={adapter.iconUrl} alt="" className="w-6 h-6 rounded object-contain flex-shrink-0" />
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{adapter.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{adapter.description}</div>
                                    </div>
                                </div>
                                {selectedProvider === adapter.id && (
                                    <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {selectedProviderInfo?.tokenRequired && (
                    <div className="mb-5">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">API token for {selectedProviderInfo.name}</label>
                        <input
                            type="password"
                            value={providerToken}
                            onChange={e => setProviderToken(e.target.value)}
                            placeholder={selectedProviderInfo.hasToken ? "Leave blank to keep existing token" : "sk-…"}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                )}

                {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

                <button
                    onClick={handleProviderSave}
                    disabled={!selectedProvider || saving || (!!selectedProviderInfo?.tokenRequired && !selectedProviderInfo.hasToken && !providerToken.trim())}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                    {saving ? "Saving…" : "Save provider"}
                </button>
            </div>
        );
    }

    // Main settings view
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 id="settings-modal-title" className="text-base font-semibold text-gray-900 dark:text-white">Settings</h2>
                <button
                    onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Close settings"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Provider */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Provider</span>
                    <button
                        onClick={() => { setSelectedProvider(adaptersData.default); setProviderToken(""); setView("provider"); }}
                        className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                    >
                        Change
                    </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                    {currentAdapter && (
                        <img src={currentAdapter.iconUrl} alt="" className="w-6 h-6 rounded object-contain flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                        <div className="text-sm text-gray-900 dark:text-white font-medium">{currentAdapter?.name ?? "None"}</div>
                        {currentAdapter && (
                            <div className="text-xs text-gray-500 mt-0.5">{currentAdapter.description}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Model */}
            {currentAdapter && (
                <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium block mb-2">Model</span>
                    <div className="space-y-1">
                        {currentAdapter.models.map(model => {
                            const active = (activeModelId ?? currentAdapter.defaultModelId) === model.id;
                            return (
                                <button
                                    key={model.id}
                                    onClick={() => handleModelSelect(model.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between gap-2 ${
                                        active ? "bg-indigo-600" : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                >
                                    <div>
                                        <span className={`text-sm font-medium ${active ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>
                                            {model.name}
                                        </span>
                                        {model.id === currentAdapter.defaultModelId && (
                                            <span className={`text-xs ml-1.5 ${active ? "text-indigo-200" : "text-gray-400 dark:text-gray-600"}`}>default</span>
                                        )}
                                    </div>
                                    {active && (
                                        <svg className="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
