import { isObject } from "../utils";
import { track } from "./effect";

export function reactive(target) {
    // 如果不是对象，就原样返回
    if (!isObject(target)) {
        return target;
    }

    const proxy = new Proxy(target, {
        get(target, key, receiver) {
            const res = Reflect.get(target, key, receiver);
            track(target,key);
            return res;
        },
        set(target, key, value, receiver) {
            const res = Reflect.set(target, key, value, receiver);
            return res;
        }
    })

    return proxy;
}