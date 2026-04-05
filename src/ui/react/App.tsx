import React, { Suspense, useState } from "react";
import useRpc from "./hooks/useRpc";
import { AppShell } from "./components/AppShell";
import { FirstTimeSetup } from "./components/FirstTimeSetup";
import { FullScreenLoader } from "./components/ui";

export default function App() {
    return (
        <Suspense fallback={<FullScreenLoader />}>
            <AppGate />
        </Suspense>
    );
}

function AppGate() {
    const [providerSet, setProviderSet] = useState(false);
    const adaptersData = useRpc("getAdapters", { adapters: [], default: null, defaultModel: null }, null, undefined);

    if (!adaptersData.default && !providerSet) {
        return (
            <FirstTimeSetup
                adapters={adaptersData.adapters}
                onComplete={() => setProviderSet(true)}
            />
        );
    }

    return <AppShell />;
}
