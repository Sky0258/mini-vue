import { isBoolean } from "../utils";
import {
    ShapeFlags
} from "./vnode";

export function render(vnode, container) {
    mount(vnode, container);
}

function mount(vnode, container) {
    const {
        shapeFlag
    } = vnode;
    if (shapeFlag & ShapeFlags.ELEMENT) {
        mountElement(vnode, container);
    } else if (shapeFlag & ShapeFlags.TEXT) {
        mountTextNode(vnode, container);
    } else if (shapeFlag & ShapeFlags.FRAGMENT) {
        mountFragment(vnode, container);
    } else {
        mountComponent(vnode, container);
    }
}

function mountElement(vnode, container) {
    const {
        type,
        props,
    } = vnode;
    const el = document.createElement(type);
    mountProps(props, el);
    mountChildren(vnode, el);
    console.log(container);
    container.appendChild(el);
    vnode.el = el;
}

function mountTextNode(vnode, container) {
    const textNode = document.createTextNode(vnode.children);
    container.appendChild(textNode);
    vnode.el = textNode;
}

function mountFragment(vnode, container) {
    mountChildren(vnode, container);
}

function mountComponent(vnode, container) {}

function mountChildren(vnode, container) {
    const {
        shapeFlag,
        children
    } = vnode;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        mountTextNode(vnode, container);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        children.forEach((child) => {
            mount(child, container);
        });
    }
}

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
// 判断是直接 el.key = value 还是得 el.setAttribute(key,value)
const domPropsRE = /[A-Z] | ^(value | checked | selected | muted | disabled)$/;
function mountProps(props, el) {
    for (const key in props) {
        let value = props[key];
        switch (key) {
            case 'class':
                el.className = value;
                break;
            case 'style':
                for (const styleName in value) {
                    el.style[styleName] = value[styleName];
                }
                break;
            default:
                if (/^on[A-Z]/.test(key)) {
                    const eventName = key.slice(2).toLowerCase();
                    // 添加事件
                    el.addEventListener(eventName, value);
                } else if (domPropsRE.test(key)) {
                    // 当用户只写了 checked 时会解析成 {'checked' : ''} (特例1)
                    if(value === '' && isBoolean(el[key])) {
                        value = true;
                    }
                    el[key] = value;
                } else {
                    // 当自定义属性 { custom : false },解析后 false 会变成字符串，所以判断出来还是 true (特例2)
                    if(value == null || value === false) {
                        el.removeAttribute(key);       // 直接把该属性从元素上移除
                    } else {
                        el.setAttribute(key, value);
                    }
                }
                break;
        }
    }
}