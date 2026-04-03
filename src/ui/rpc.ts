import type r from "../rpc";
import z from "zod";

export type RPC = {
    [K in keyof typeof r]: (arg: z.infer<typeof r[K]["input"]>) => Promise<z.infer<typeof r[K]["output"]>>;
};

export const rpcMethods: RPC = new Proxy({} as RPC, {
    get: (target: any, prop: any) => {
        const fn = target[prop];
        if (fn) return fn;
        const x = (arg: any) => {
            // @ts-expect-error
            return rpc.invoke(prop, arg);
        };
        target[prop] = x;
        return x;
    },
});
