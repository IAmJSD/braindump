export type Page = "home" | "calendar";
export type Tab = "tasks" | "landmark";
export type SettingsView = "main" | "provider";

export type AdapterInfo = {
    id: string;
    name: string;
    description: string;
    privacyNotes: string[];
    tokenRequired: boolean;
    hasToken: boolean;
    models: { id: string; name: string }[];
    defaultModelId: string;
    iconUrl: string;
};
