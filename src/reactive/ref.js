import { hasChanged, isObject } from "../utils";
import { track, trigger } from "./effect";
import { reactive } from "./reactive";

export function ref(value) {
    if(isRef(value)) {
        return value;
    }

    return new RefImpl(value);
}

export function isRef(value) {
    return !!(value && value.__isRef);
}

class RefImpl {
    constructor(value) {
        this.__isRef = true;
        this._value = convert(value);
    }

    get value() {
        track(this, 'value');
        return this._value;
    }

    set value(newValue) {
        if(hasChanged(newValue, this._value)) {  // 当新旧值不同时，才运行依赖函数
            this._value = convert(newValue);
            trigger(this, 'value');
        }
    }
}

// 判断是否是对象，是对象就调用 reactive ，不是则原样返回
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}