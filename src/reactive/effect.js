// 记录当前执行的副作用函数
let activeEffect;

export function effect(fn) {
    const effectFn = () => {
        // 以防用户自定义的函数出错，所以要 try catch
        try {
            return fn();
        } finally {
            // todo
        }
    };
    effectFn();
    return effectFn;
}

const targetMap = new WeakMap();
// 保存副作用函数中的依赖
export function track(target,key) {
    if(!activeEffect) {
        return;
    }

    let depsMap = targetMap.get(target);
    if(!depsMap) {
        targetMap.set(target,(depsMap = new Map()));
    }

    let deps = depsMap.get(key);
    if(!deps) {
        depsMap.set(key, (deps = new Set()));
    }

    deps.add(activeEffect);
}