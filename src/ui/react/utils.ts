export const MONTH_NAMES = ["January","February","March","April","May","June",
    "July","August","September","October","November","December"];
export const DAY_HEADERS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export function moodColor(mood: number): string {
    if (mood > 0.6) return "#22c55e"; // green-500
    if (mood > 0.3) return "#eab308"; // yellow-500
    return "#ef4444"; // red-500
}

export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
