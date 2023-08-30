// 用栈存储副作用函数，避免嵌套 effect 时，外部 effect 函数失效
const effectStack = [];
// 记录当前执行的副作用函数
let activeEffect;

export function effect(fn, options = {}) {
    const effectFn = () => {
        // 以防用户自定义的函数出错，所以要 try catch
        try {
            activeEffect = effectFn;
            effectStack.push(activeEffect);
            return fn();
        } finally {
            effectStack.pop();
            activeEffect = effectStack[effectStack.length - 1];
        }
    };

    if(!options.lazy) {     // 因为 computed 是缓存依赖函数的，等调用了值才执行依赖函数
        effectFn();
    }
    
    // 调度函数(computed)
    effectFn.scheduler = options.scheduler;

    return effectFn;
}

const targetMap = new WeakMap();
// 保存副作用函数中的依赖 （保存依赖）
export function track(target,key) {
    if(!activeEffect) {
        return;
    }

    // targetMap(一个WeakMap),键是调用的 target 对象
    let depsMap = targetMap.get(target);
    if(!depsMap) {
        targetMap.set(target,(depsMap = new Map()));
    }

    // 值是 Map , map 的键是 调用的属性 key , 值是副作用函数 （这样就可以把依赖建立起来）
    let deps = depsMap.get(key);
    if(!deps) {
        depsMap.set(key, (deps = new Set()));
    }

    deps.add(activeEffect);  // 添加副作用函数 到 Set 中
}

// 相当于 track 的逆运算，（执行依赖）
export function trigger(target, key) {
    const depsMap = targetMap.get(target);
    // target 找不到 说明 target 没有依赖
    if(!depsMap) {
        return;
    }

    // key 找不到 说明 key 没有依赖
    const deps = depsMap.get(key);
    if(!deps) {
        return;
    }

    // 能找得到，就把所有依赖函数都执行一遍
    deps.forEach(effectFn => {
        if(effectFn.scheduler) {
            effectFn.scheduler(effectFn); 
        }else {
            effectFn();
        }
    });
}