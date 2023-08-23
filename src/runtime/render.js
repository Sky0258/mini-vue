import {
    ShapeFlags
} from "./vnode";
import {
    patchProps
} from "./patchProps";
import { doc } from "prettier";

export function render(vnode, container) {
    // 对比前后结点
    const prevVNode = container._vnode;
    // 如果当前结点不存在，而之前有该虚拟dom，怎么卸载原来的结点
    if (!vnode) {
        if (prevVNode) {
            unmount(prevVNode);
        }
    } else {
        // 如果前后结点都存在，就对比差异，进行更新
        patch(prevVNode, vnode, container);
    }

    // 记录更新后的结点，为下次更新时提供原本结点数据
    container._vnode = vnode;
}

function unmount(vnode) {
    const {
        shapeFlag,
        el
    } = vnode;
    if (shapeFlag & ShapeFlags.COMPONENT) {
        unmountComponent(vnode);
    } else if (shapeFlag & ShapeFlags.FRAGMENT) {
        unmountFragment(vnode);
    } else {
        // 剩下的可以直接使用 removeChild 删除结点
        el.parentNode.removeChild(el);
    }
}

function unmountComponent(vnode) {
    // todo
}

function unmountFragment(vnode) {
    let { el: cur, anchor: end } = vnode;
    const parentNode = cur.parentNode;

    while(cur !== end) {
        let next = cur.nextSibling;    // next 设置为兄弟结点
        parentNode.removeChild(cur);
        cur = next;
    }

    parentNode.removeChild(end);
}

function unmountChildren(children) {
    children.forEach((child) => {
        unmount(child);
    })
}

// 更新操作
function patch(n1, n2, container, anchor) {
    // 判断 n1 和 n2 的类型是否相同，要是不相同，就直接把 n1 卸载
    if (n1 && !isSameVNode(n1, n2)) {
        anchor = (n1.anchor || n1.el).nextSibling;  // 要删除该结点之前，要设置好 anchor 的指向
        unmount(n1);
        n1 = null;
    }

    const {
        shapeFlag
    } = n2;
    if (shapeFlag & ShapeFlags.COMPONENT) {
        processComponent(n1, n2, container, anchor);
    } else if (shapeFlag & ShapeFlags.TEXT) {
        processText(n1, n2, container, anchor);
    } else if (shapeFlag & ShapeFlags.FRAGMENT) {
        processFragment(n1, n2, container, anchor);
    } else {
        processElement(n1, n2, container, anchor);
    }
}

// 判断新旧结点类型是否相同
function isSameVNode(n1, n2) {
    return n1.type === n2.type;
}

function processComponent(n1, n2, container, anchor) {
    // todo
}

function processText(n1, n2, container, anchor) {
    if (n1) {
        // 把原本 n1 的 el 给 n2
        n2.el = n1.el;
        // 直接修改 n1 的内容为 n2.children 即可
        n1.el.textContent = n2.children;
    } else {
        mountTextNode(n2, container, anchor);
    }
}

function processFragment(n1, n2, container, anchor) {
    // 当 n1 没有 el 和 anchor 时，(因为如果 patch 很多次的话，n1 就会有 el 和 anchor)
    // 手动建立两个结点包裹 fragment 这样就能从这两个节点中间插入，而不是直接插入到容器的末尾，导致顺序错乱
    const fragmentStartAnchor = n1 ? n1.el : document.createTextNode('');  // el
    const fragmentEndAnchor = n1 ? n1.anchor : document.createTextNode('');    // anchor

    n2.el = fragmentStartAnchor;
    n2.anchor = fragmentEndAnchor;

    if (n1) {
        patchChildren(n1, n2, container, fragmentEndAnchor);
    } else {
        // container.appendChild(fragmentStartAnchor);
        // container.appendChild(fragmentEndAnchor);
        container.insertBefore(fragmentEndAnchor, anchor);
        container.insertBefore(fragmentStartAnchor, anchor);
        mountChildren(n2.children, container, fragmentEndAnchor);
    }
}

function processElement(n1, n2, container, anchor) {
    if (n1) {
        patchElement(n1, n2);
    } else {
        mountElement(n2, container, anchor);
    }
}

// 创建挂载 Text 类型的结点
function mountTextNode(vnode, container, anchor) {
    const textNode = document.createTextNode(vnode.children);
    // container.appendChild(textNode);
    container.insertBefore(textNode, anchor);
    vnode.el = textNode;
}

// 创建挂载 Element 类型的结点
function mountElement(vnode, container, anchor) {
    const {
        type,
        props,
        shapeFlag,
        children
    } = vnode;
    const el = document.createElement(type);
    patchProps(null, props, el);

    // 创建挂载 children 结点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        mountTextNode(vnode, el);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(children, el);
    }
    // container.appendChild(el);  这也写后续 fragment 更新有子结点时，会直接插入到 container 尾部，导致顺序错乱
    container.insertBefore(el, anchor);
    vnode.el = el;
}

// 当 children 为数组类型， children 挂载处理
function mountChildren(children, container, anchor) {
    children.forEach((child) => {
        // mount(child, container);
        // 改成用 patch  n1 是 null,因为是新创建的，没有旧结点
        patch(null, child, container, anchor);
    });
}

// 更新 Element 类型结点
function patchElement(n1, n2) {
    n2.el = n1.el;
    // 跟 mountElement 相对应
    // 先比较 props
    patchProps(n1.props, n2.props, n2.el);

    // 再比较 children
    patchChildren(n1, n2, n2.el);
}

// 更新子结点， 有 9 种情况判断
function patchChildren(n1, n2, container, anchor) {
    const { shapeFlag: prevShapeFlag, children: c1} = n1;
    const { shapeFlag, children: c2} = n2;

    // 当 n2 为 Text 类型，对应 n1 三种类型分别有不同的更新方法
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 重复操作进行合并，一开始应该有 3 个分支的
        if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            unmountChildren(c1);
        } 

        if (c1 !== c2) {
            container.textContent = c2;
        }
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 当 n2 为 Array 类型，对应 n1 三种类型分别有不同的更新方法
        if (prevShapeFlag & shapeFlag.TEXT_CHILDREN) {
            container.textContent = '';
            mountChildren(c2, container, anchor);
        } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            patchArrayChildren(c1, c2, container, anchor);
        } else {
            mountChildren(c2, container, anchor);
        }

    } else {
        // 当 n2 为 null，对应 n1 三种类型分别有不同的更新方法，当 n1 n2 都为 null  不用做任何处理
        if (prevShapeFlag & shapeFlag.TEXT_CHILDREN) {
            container.textContent = '';
        } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            unmountChildren(c1);
        } 
    }

}

// 当子节点为数组时，更新子结点
function patchArrayChildren(c1, c2, container, anchor) {
    const oldLength = c1.length;
    const newLength = c2.length;
    const commonLength = Math.min(oldLength, newLength);

    for (let i = 0;i < commonLength;i++) {
        patch(c1[i], c2[i], container, anchor);
    }

    if (oldLength > newLength) {
        unmountChildren(c1.slice(commonLength));
    } else if (oldLength < newLength) {
        mountChildren(c2.slice(commonLength), container, anchor);
    }
}