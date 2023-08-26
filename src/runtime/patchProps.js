/*  props 参照
    {
        class: 'btn',
        style: {
            color: 'red',
            fontSize: '14px',
        },
        onClick: () => console.log('click'),
        checked: '',
        custom: false
    }
*/

import {
    isBoolean
} from "../utils";

// 判断是直接 el.key = value 还是得 el.setAttribute(key,value)
const domPropsRE = /[A-Z] | ^(value | checked | selected | muted | disabled)$/;
// 更新结点 vnode 的 props 
export function patchProps(oldProps, newProps, el) {
    // 对比前后 props 对象是否相等，相等则返回
    if (oldProps === newProps) {
        return;
    }

    // 避免对象为 null
    oldProps = oldProps || {};
    newProps = newProps || {};

    // 不相等则遍历对象中的每个属性，使用 patchDomProp 进行比较
    for (const key in newProps) {
        if(key === 'key') {   // key 属性不用判断，特殊
            continue;
        }

        const next = newProps[key];
        const prev = newProps[key];

        if (prev !== next) {
            patchDomProp(prev, next, key, el);
        }
    }

    // 移除掉旧 props 中有而新 props 中没有的属性
    for (const key in oldProps) {
        if (key !== 'key' && newProps[key] == null) {
            patchDomProp(oldProps[key], null, key, el);
        }
    }
}

// 更新 vnode 中 props 的每个属性值
function patchDomProp(prev, next, key, el) {
    switch (key) {
        case 'class':
            el.className = next || '';
            break;
        case 'style':
            if (next == null) {
                el.removeAttribute('style');
            } else {
                for (const styleName in next) {
                    el.style[styleName] = next[styleName];
                }

                // 删除掉，next 中没有而 pre 中有的 style 属性
                if (prev) {
                    for (const styleName in prev) {
                        if (next[styleName] === null) {
                            el.style[styleName] = '';
                        }
                    }
                }
            }
            break;
        default:
            if (/^on[A-Z]/.test(key)) {
                // 情况1：判断事件

                const eventName = key.slice(2).toLowerCase();
                // 直接把旧事件移除，然后添加新事件
                if (prev) {
                    el.removeAttribute(eventName, prev);
                }
                if (next) {
                    el.addEventListener(eventName, next);
                }
            } else if (domPropsRE.test(key)) {
                // 情况2：判断 checked selected 这种可以直接 doc.checked = true 定义的属性

                // 当用户只写了 checked 时会解析成 {'checked' : ''} (特例1)
                if (next === '' && isBoolean(el[key])) {
                    next = true;
                }
                el[key] = next;
            } else {
                // 情况3：判断自定义属性，一定得用 setAttribute 建立的属性

                // 当自定义属性 { custom : false },解析后 false 会变成字符串，所以判断出来还是 true (特例2)
                if (next == null || next === false) {
                    el.removeAttribute(key); // 直接把该属性从元素上移除
                } else {
                    el.setAttribute(key, next);
                }
            }
            break;
    }
}