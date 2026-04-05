import React, { useState } from "react";
import type { Page } from "../types";
import { HomeView } from "./HomeView";
import { CalendarView } from "./CalendarView";
import { SettingsModal } from "./SettingsModal";
import { SearchModal } from "./SearchModal";

export function AppShell() {
    const [page, setPage] = useState<Page>("home");
    const [dataVersion, setDataVersion] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const refresh = () => setDataVersion(v => v + 1);

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
            {/* Top nav */}
            <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">Braindump</span>
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-0.5">
                    <button
                        onClick={() => setPage("home")}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                            page === "home" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                    >
                        Home
                    </button>
                    <button
                        onClick={() => setPage("calendar")}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                            page === "calendar" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                    >
                        Calendar
                    </button>
                </div>
                <div className="flex items-center gap-1">
                <button
                    onClick={() => setShowSearch(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Search"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                </button>
                <button
                    onClick={() => setShowSettings(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Settings"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                </button>
                </div>
            </nav>

            {/* Page content */}
            <div className="flex-1 overflow-hidden">
                {page === "home"
                    ? <HomeView dataVersion={dataVersion} onRefresh={refresh} />
                    : <CalendarView dataVersion={dataVersion} onRefresh={refresh} />
                }
            </div>

            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
            {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
        </div>
    );
}
