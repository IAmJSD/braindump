import React, { Suspense, useMemo, useState } from "react";
import { rpcMethods } from "../../rpc";
import useRpc from "../hooks/useRpc";
import { MONTH_NAMES, DAY_HEADERS, moodColor } from "../utils";
import { UrgencyBadge, MoodBar, EmptyState, PanelLoader } from "./ui";

export function CalendarView({ dataVersion, onRefresh }: { dataVersion: number; onRefresh: () => void }) {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth()); // 0-indexed
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [completing, setCompleting] = useState<number | null>(null);

    const range = useMemo(() => ({
        start: new Date(year, month, 1).toISOString(),
        end: new Date(year, month + 1, 0, 23, 59, 59).toISOString(),
    }), [year, month]);

    const prevMonth = () => {
        setSelectedDay(null);
        if (month === 0) { setYear(y => y - 1); setMonth(11); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        setSelectedDay(null);
        if (month === 11) { setYear(y => y + 1); setMonth(0); }
        else setMonth(m => m + 1);
    };
    const goToday = () => {
        setYear(now.getFullYear());
        setMonth(now.getMonth());
        setSelectedDay(now.getDate());
    };

    const handleComplete = async (id: number) => {
        setCompleting(id);
        try {
            await rpcMethods.completeTask({ id });
            onRefresh();
        } finally {
            setCompleting(null);
        }
    };

    // Mon-first grid: pad = (dayOfWeek + 6) % 7
    const firstDow = new Date(year, month, 1).getDay();
    const startPad = (firstDow + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array(startPad).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const isToday = (d: number) =>
        d === now.getDate() && month === now.getMonth() && year === now.getFullYear();

    return (
        <div className="h-full flex overflow-hidden">
            {/* Calendar grid */}
            <div className="flex-1 flex flex-col p-8 overflow-y-auto min-w-0">
                {/* Month header */}
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {MONTH_NAMES[month]} {year}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToday}
                            className="px-3 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            Today
                        </button>
                        <button
                            onClick={prevMonth}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={nextMonth}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1 flex-shrink-0">
                    {DAY_HEADERS.map(d => (
                        <div key={d} className="text-xs text-gray-400 dark:text-gray-600 text-center py-1 font-medium">{d}</div>
                    ))}
                </div>

                {/* Grid */}
                <Suspense fallback={null}>
                    <CalendarGrid
                        year={year}
                        month={month}
                        cells={cells}
                        range={range}
                        dataVersion={dataVersion}
                        selectedDay={selectedDay}
                        onSelectDay={d => setSelectedDay(prev => prev === d ? null : d)}
                        isToday={isToday}
                    />
                </Suspense>
            </div>

            {/* Right: selected day events */}
            <div className="w-80 xl:w-96 border-l border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-gray-900 flex-shrink-0">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {selectedDay
                            ? `${MONTH_NAMES[month]} ${selectedDay}`
                            : "Select a day"
                        }
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {selectedDay
                        ? <Suspense fallback={<PanelLoader />}>
                            <DayEvents
                                year={year}
                                month={month}
                                day={selectedDay}
                                range={range}
                                dataVersion={dataVersion}
                                completing={completing}
                                onComplete={handleComplete}
                            />
                          </Suspense>
                        : <div className="flex items-center justify-center h-24 text-gray-400 dark:text-gray-600 text-xs">
                            Click a day to see events
                          </div>
                    }
                </div>
            </div>
        </div>
    );
}

// Separated so Suspense can wrap the data-fetching part without blocking the grid chrome
function CalendarGrid({
    year, month, cells, range, dataVersion, selectedDay, onSelectDay, isToday,
}: {
    year: number; month: number;
    cells: (number | null)[];
    range: { start: string; end: string };
    dataVersion: number;
    selectedDay: number | null;
    onSelectDay: (d: number) => void;
    isToday: (d: number) => boolean;
}) {
    const events = useRpc("getCalendarEvents", [], dataVersion, range);
    const landmarks = useRpc("getLandmarkThoughts", [], dataVersion, undefined);
    const moodData = useRpc("getMoodByDay", [], dataVersion, range);

    const moodByDay = useMemo(() => {
        const map = new Map<number, number>();
        for (const { date, averageMood } of moodData) {
            const d = new Date(date + "T00:00:00");
            if (d.getFullYear() === year && d.getMonth() === month) {
                map.set(d.getDate(), averageMood);
            }
        }
        return map;
    }, [moodData, year, month]);

    const eventsByDay = useMemo(() => {
        const map = new Map<number, typeof events>();
        for (const e of events) {
            if (!e.startDate) continue;
            const d = new Date(e.startDate);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate();
                if (!map.has(day)) map.set(day, []);
                map.get(day)!.push(e);
            }
        }
        return map;
    }, [events, year, month]);

    const landmarksByDay = useMemo(() => {
        const map = new Map<number, typeof landmarks>();
        for (const l of landmarks) {
            const d = new Date(l.createdAt);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate();
                if (!map.has(day)) map.set(day, []);
                map.get(day)!.push(l);
            }
        }
        return map;
    }, [landmarks, year, month]);

    return (
        <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
                if (!day) return <div key={i} className="h-14" />;
                const dayEvents = eventsByDay.get(day) ?? [];
                const dayLandmarks = landmarksByDay.get(day) ?? [];
                const avgMood = moodByDay.get(day);
                const selected = selectedDay === day;
                const today = isToday(day);
                return (
                    <button
                        key={i}
                        onClick={() => onSelectDay(day)}
                        className={`h-14 rounded-xl flex flex-col items-center justify-start pt-2 relative transition-colors ${
                            selected
                                ? "bg-indigo-600"
                                : today
                                ? "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                    >
                        <span className={`text-sm font-medium leading-none ${
                            selected ? "text-white" : today ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"
                        }`}>
                            {day}
                        </span>
                        {(dayEvents.length > 0 || dayLandmarks.length > 0) && (
                            <div className="flex gap-0.5 mt-1 justify-center">
                                {dayEvents.slice(0, 3).map((e, j) => (
                                    <div key={`e${j}`} className={`w-1 h-1 rounded-full flex-shrink-0 ${
                                        e.urgency > 0.7 ? "bg-red-400" :
                                        e.urgency > 0.4 ? "bg-yellow-400" : "bg-green-400"
                                    }`} />
                                ))}
                                {dayLandmarks.slice(0, 2).map((_, j) => (
                                    <div key={`l${j}`} className="w-1 h-1 rounded-sm flex-shrink-0 bg-indigo-400" />
                                ))}
                            </div>
                        )}
                        {avgMood !== undefined && (
                            <div
                                className="absolute bottom-1 left-1.5 right-1.5 h-0.5 rounded-full opacity-70"
                                style={{ backgroundColor: moodColor(avgMood) }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

function DayEvents({
    year, month, day, range, dataVersion, completing, onComplete,
}: {
    year: number; month: number; day: number;
    range: { start: string; end: string };
    dataVersion: number;
    completing: number | null;
    onComplete: (id: number) => void;
}) {
    const events = useRpc("getCalendarEvents", [], dataVersion, range);
    const landmarks = useRpc("getLandmarkThoughts", [], dataVersion, undefined);

    const dayEvents = events.filter(e => {
        if (!e.startDate) return false;
        const d = new Date(e.startDate);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
    const dayLandmarks = landmarks.filter(l => {
        const d = new Date(l.createdAt);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

    if (dayEvents.length === 0 && dayLandmarks.length === 0) {
        return <EmptyState message="Nothing this day" />;
    }

    return (
        <div className="p-3 space-y-2">
            {dayEvents.map(e => (
                <div key={`e${e.id}`} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-transparent rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                        <span className="text-gray-900 dark:text-white text-sm font-medium leading-snug">{e.title}</span>
                        <UrgencyBadge urgency={e.urgency} />
                    </div>
                    {e.description && (
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 line-clamp-3">{e.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                        {e.startDate && (
                            <span className="text-gray-400 dark:text-gray-600 text-xs">
                                {new Date(e.startDate).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                                {e.endDate && ` – ${new Date(e.endDate).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`}
                            </span>
                        )}
                        <button
                            onClick={() => onComplete(e.id)}
                            disabled={completing === e.id}
                            className="text-xs text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400 disabled:opacity-40 transition-colors flex items-center gap-1"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            {completing === e.id ? "…" : "Done"}
                        </button>
                    </div>
                </div>
            ))}
            {dayLandmarks.map(l => (
                <div key={`l${l.id}`} className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-200/40 dark:border-indigo-800/40 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-1.5 h-1.5 rounded-sm bg-indigo-400 flex-shrink-0" />
                        <span className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">Landmark</span>
                    </div>
                    <p className="text-gray-900 dark:text-white text-sm leading-relaxed">{l.content}</p>
                    {l.aiSummary && l.aiSummary !== l.content && (
                        <p className="text-indigo-500/50 dark:text-indigo-300/50 text-xs mt-1.5 italic line-clamp-2">{l.aiSummary}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-indigo-400/60 dark:text-indigo-400/50 text-xs">
                            {new Date(l.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        </span>
                        <MoodBar mood={l.mood} />
                    </div>
                </div>
            ))}
        </div>
    );
}
