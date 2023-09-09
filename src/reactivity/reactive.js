import {
    hasChanged,
    isArray,
    isObject
} from "../utils";
import {
    track,
    trigger
} from "./effect";

const proxyMap = new WeakMap(); // 当调用 reactive 的参数对象相同时，返回同一个代理对象 (特例2)
export function reactive(target) {
    // 如果不是对象，就原样返回
    if (!isObject(target)) {
        return target;
    }

    // 避免嵌套调用 reactive   reactive(reactive(obj)) 只需要代理一次 (特例1)
    if (isReactive(target)) {
        return target;
    }

    if (proxyMap.has(target)) {
        return proxyMap.get(target); // 当调用 reactive 的参数对象相同时，返回同一个代理对象
    }

    
    const proxy = new Proxy(target, {
        get(target, key, receiver) {
            if (key === '__isReactive') {
                return true;
            }
            const res = Reflect.get(target, key, receiver);
            track(target, key);
            return isObject(res) ? reactive(res) : res;  // 深层对象代理（特例4）
            // 当该属性的值也为对象时，同时有副作用函数依赖时，再次进行递归代理
        },
        set(target, key, value, receiver) {
            let oldLength = target.length;
            const oldValue = target[key];

            const res = Reflect.set(target, key, value, receiver);

            // 当新旧值不相同时，确切的发生改变时才触发副作用函数 (特例3)
            if (hasChanged(oldValue, value)) {
                trigger(target, key);
                if(isArray(target) && hasChanged(oldLength, target.length)) {  // 当目标为数组时，push 时手动 trigger length (特例5)
                    trigger(target,'length');
                }
            }

            return res;
        }
    })

    proxyMap.set(target, proxy);
    return proxy;
}

export function isReactive(target) {
    return !!(target && target.__isReactive);
}