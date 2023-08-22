// 工具类判断是否为对象类型
export function isObject(target) {
    return typeof target === 'object' && target !== null;
}

// 判断是否为数组
export function isArray(target) {
    return Array.isArray(target);
}

// 判断是否为函数
export function isFunction(target) {
    return typeof target === 'function';
}

export function isString(target) {
    return typeof target === 'string';
}

export function isNumber(target) {
    return typeof target === 'number';
}

export function isBoolean(target) {
    return typeof target === 'boolean';
}

// 判断值是否发生改变
export function hasChanged(oldValue, value) {
    return oldValue !== value && !(Number.isNaN(oldValue) && Number.isNaN(value));  // 新老值不相等，且两个值都不能为 NaN 因为 NaN !== NaN 所以一定放回的是改变
}