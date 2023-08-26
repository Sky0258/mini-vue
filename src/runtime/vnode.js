import {
    isArray,
    isNumber,
    isObject,
    isString
} from "../utils";

// 用于判断结点类型 (只写了主要的四种类型: dom元素，纯文本，Fragment，组件)
export const ShapeFlags = {
    ELEMENT: 1,
    TEXT: 1 << 1,
    FRAGMENT: 1 << 2,
    COMPONENT: 1 << 3,
    TEXT_CHILDREN: 1 << 4,
    ARRAY_CHILDREN: 1 << 5,
    CHILDREN: (1 << 4) | (1 << 5)
};

export const Text = Symbol('Text');
export const Fragment = Symbol('Fragment');

/**
 * 
 * @param {string | Object | Text | Fragment} type 
 * @param {Object | null} props 
 * @param {string | number | Array | null} children 
 * @returns VNode
 */
export function h(type, props, children) {
    let shapeFlag = 0;
    if (isString(type)) {
        shapeFlag = ShapeFlags.ELEMENT;
    } else if (type === Text) {
        shapeFlag = ShapeFlags.TEXT;
    } else if (type === Fragment) {
        shapeFlag = ShapeFlags.FRAGMENT;
    } else {
        shapeFlag = ShapeFlags.COMPONENT;
    }

    if (isString(children) || isNumber(children)) {
        shapeFlag |= ShapeFlags.TEXT_CHILDREN;
        children - children.toString();
    } else if (isArray(children)) {
        shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    }

    return {
        type,
        props,
        children,
        shapeFlag,
        el: null,     // 指向 vnode 的真实的 dom 结点
        anchor: null,   // 为 fragment 更新时插入，不会插入到末尾，设置一个标识从中间插入
        key: props && props.key,     // 用来更直观简单的判断两个结点是否为同一个结点（相等）
        component: null     // 专门用于存储组件的实例
    };
}

// 防止 render 返回值不是 vnode 出错，判断各种类型返回值进行处理，使得一定返回 vnode 结点
export function normalizeVnode(result) {
    if(isArray(result)) {
        return h(Fragment, null, result);
    }
    if(isObject(result)) {
        // 说明已经是 vnode 结点了
        return result;
    }
    
    // 剩下的只能是 string number
    return h(Text, null, result.toString());
}