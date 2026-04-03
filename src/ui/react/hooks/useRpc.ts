import { useEffect, useRef, useState } from "react";
import { type RPC, rpcMethods } from "../../rpc";

const none = Symbol("none");

// cacheKey: any value — when it changes, the RPC is re-fetched.
// Stale-while-revalidate: old data is shown while the new fetch is in progress,
// so the panel never suspends again after the initial load.
export default function useRpc<Key extends keyof RPC>(
    name: Key,
    serverRender: Awaited<ReturnType<RPC[Key]>>,
    cacheKey: unknown,
    ...args: Parameters<RPC[Key]>
): Awaited<ReturnType<RPC[Key]>> {
    const [serverRendered, setServerRendered] = useState(true);
    const promiseRef = useRef<[Promise<void>, Awaited<ReturnType<RPC[Key]>> | typeof none] | null>(null);
    // Holds the last successfully fetched value so we can show it while re-fetching.
    const [cachedValue, setCachedValue] = useState<Awaited<ReturnType<RPC[Key]>> | typeof none>(none);

    useEffect(() => {
        let cancelled = false;
        const s: [Promise<void>, Awaited<ReturnType<RPC[Key]>> | typeof none] = [Promise.resolve(), none];
        s[0] = (async () => {
            // @ts-expect-error: Could be 0 or 1 args
            const r = await rpcMethods[name](...args);
            if (!cancelled) {
                // @ts-expect-error: We know what type this will be
                s[1] = r;
                setCachedValue(r as Awaited<ReturnType<RPC[Key]>>);
            }
        })();
        promiseRef.current = s;
        setServerRendered(false);
        return () => { cancelled = true; };
    }, [name, cacheKey, ...args]);

    if (serverRendered) return serverRender;
    if (!promiseRef.current) throw new Error("useRpc: promiseRef is not set");

    // New fetch in flight but we have stale data — show it instead of suspending.
    if (promiseRef.current[1] === none && cachedValue !== none) return cachedValue;

    if (promiseRef.current[1] !== none) return promiseRef.current[1];
    throw promiseRef.current[0];
}
