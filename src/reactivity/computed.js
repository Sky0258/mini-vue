import { isFunction } from "../utils";
import { effect, track, trigger } from "./effect";

export function computed(getterOrOption) {
    let getter, setter;

    if(isFunction(getterOrOption)) {
        getter = getterOrOption;
        setter = () => {
            console.warn('computed is readonly');
        };
    }else {
        getter = getterOrOption.get;
        setter = getterOrOption.set;
    }

    return new ComputedImpl(getter, setter);
}

class ComputedImpl {
    constructor(getter, setter) {
        this._setter = setter;
        this._value = undefined;
        this._dirty = true;
        this.effect = effect(getter, {
            lazy: true,
            // 调度函数
            scheduler: () => {
                this._dirty = true;
                trigger(this, 'value');
            },
        })
    }

    get value() {
        if(this._dirty) {
            this._value = this.effect(); // effect返回值 是执行 getter 之后的返回值 
            this._dirty = false;
            track(this, 'value');
        }

        return this._value;
    }

    set value(newValue) {
        this._setter(newValue);
    }
}