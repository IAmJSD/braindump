import React from "react";

export function SuicidePreventionScreen({ onDismiss }: { onDismiss: () => void }) {
    return (
        <div className="h-full bg-white dark:bg-gray-950 flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center">
                <div className="text-5xl mb-6">💙</div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">You're not alone</h1>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    It sounds like you're going through something really difficult right now.
                    Please reach out — there are people who want to help.
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6 text-left space-y-3">
                    <div>
                        <div className="text-gray-900 dark:text-white font-medium text-sm">International Association for Suicide Prevention</div>
                        <div className="text-indigo-500 dark:text-indigo-400 text-sm">https://www.iasp.info/resources/Crisis_Centres/</div>
                    </div>
                    <div>
                        <div className="text-gray-900 dark:text-white font-medium text-sm">Crisis Text Line (US/UK/CA/IE)</div>
                        <div className="text-gray-500 dark:text-gray-400 text-sm">Text HOME to 741741</div>
                    </div>
                    <div>
                        <div className="text-gray-900 dark:text-white font-medium text-sm">Samaritans (UK & Ireland)</div>
                        <div className="text-gray-500 dark:text-gray-400 text-sm">116 123 — free, 24/7</div>
                    </div>
                </div>
                <button onClick={onDismiss} className="text-gray-400 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 text-sm transition-colors">
                    Return to Braindump
                </button>
            </div>
        </div>
    );
}
