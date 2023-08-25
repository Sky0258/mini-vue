import {
    ShapeFlags
} from "./vnode";
import {
    patchProps
} from "./patchProps";
import {
    doc
} from "prettier";

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
    let {
        el: cur,
        anchor: end
    } = vnode;
    const parentNode = cur.parentNode;

    while (cur !== end) {
        let next = cur.nextSibling; // next 设置为兄弟结点
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
        anchor = (n1.anchor || n1.el).nextSibling; // 要删除该结点之前，要设置好 anchor 的指向
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
    const fragmentStartAnchor = n1 ? n1.el : document.createTextNode(''); // el
    const fragmentEndAnchor = n1 ? n1.anchor : document.createTextNode(''); // anchor

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
    const {
        shapeFlag: prevShapeFlag,
        children: c1
    } = n1;
    const {
        shapeFlag,
        children: c2
    } = n2;

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
            // 简单的认为，只要第一个元素有 key，那么子节点数组里每个元素都有 key
            if (c1[0] && c1[0].key != null && c2[0] && c2[0].key != null) {
                patchKeyedChildren(c1, c2, container, anchor);
            } else {
                patchUnkeyedChildren(c1, c2, container, anchor);
            }
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

// 当子节点为数组时,且没有 key 时，更新子结点
// 核心 diff 算法 解决 c1: a b c   c2: x a b c 
// 在没有 key 的情况下，是把 a 改为 x, 顺位改下去，最后加上 c
// 在有 key 的情况下，是直接在 a 前面加上 x
function patchUnkeyedChildren(c1, c2, container, anchor) {
    const oldLength = c1.length;
    const newLength = c2.length;
    const commonLength = Math.min(oldLength, newLength);

    for (let i = 0; i < commonLength; i++) {
        patch(c1[i], c2[i], container, anchor);
    }

    if (oldLength > newLength) {
        unmountChildren(c1.slice(commonLength));
    } else if (oldLength < newLength) {
        mountChildren(c2.slice(commonLength), container, anchor);
    }
}


// maxNewIndexSoFar 例子：
// a b c  ->  a c b
// 这个是 react 核心 diff 算法,有缺陷当 a b c -> c a b ,这个 diff 算法需要移动两次, c 不动, a b 都要移动
// 更好的算法其实只需要移动一次  移动 c 即可, react diff算法是比较原始简单的,所以性能上也会差一点
function patchKeyedChildren2(c1, c2, container, anchor) {
    // 用标志来判断是否需要移动，如果是一直递增，则不用移动，当有下降时才需移动
    let maxNewIndexSoFar = 0;

    const map = new Map();
    // 优化：把 c1 存在哈希map里 
    // key 是结点的 key 属性，value 是对象，里面放 结点和遍历时的下标(j)，以备后面判断是否需要移动位置
    c1.forEach((prev, j) => {
        map.set(prev.key, {
            prev,
            j
        })
    })

    // c2 中每个结点对照 c1 中有没有，有的话就进行 patch 更新，然后插入到合适的位置
    for (let i = 0; i < c2.length; i++) {
        const next = c2[i];
        const curAnchor = i === 0 ? c1[0].el : c2[i - 1].el.nextSibling; // i == 0 说明是 c2 的第一个结点; 找不到时,那么直接插入到 c1 的一开始; 找得到时,c1.el 跟 c2.el相同; 反之的是从中间插入
        if (map.has(next.key)) {
            const {
                prev,
                j
            } = map.get(next.key);
            patch(prev, next, container, anchor);

            if (j < maxNewIndexSoFar) {
                container.insertBefore(next.el, curAnchor);
            } else {
                maxNewIndexSoFar = j;
            }
            map.delete(next.key); // 找到了就在 map 中删掉,最后剩下的就是 c1 中有 c2 中没有的结点,遍历把这些结点卸载掉就行
        } else {
            // 找不到就插入新结点
            patch(null, next, container, curAnchor);
        }
    }

    // 卸载掉 map 中剩余的结点
    map.forEach(({
        prev
    }) => {
        unmount(prev);
    })
}


// vue 的核心 diff 算法 (利用公共最长上升子序列算法)
function patchKeyedChildren(c1, c2, container, anchor) {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 2;

    // 1.从左至右依次对比
    while (i <= e1 && i <= e2 && c1[i].key === c2[i].key) {
        patch(c1[i], c2[i], container, anchor);
        i++;
    }

    // 2.从右至左依次对比
    while (i <= e1 && i <= e2 && c1[e1].key === c2[e2].key) {
        patch(c1[e1], c2[e2], container, anchor);
        e1--;
        e2--;
    }

    // 3. 当 i > e1 的时候，说明旧结点已经比对完，剩下的新结点直接 mount, 例子： 旧： a b c   新： a d b c  要增加 d 结点
    if (i > e1) {
        for (let j = i; j <= e2; j++) {
            const nextPos = e2 + 1;
            const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor; // 避免 e2 是最后一个，那它的下一个就是空，那其实就是直接用 anchor,把它放到 container 的最后
            patch(null, c2[j], container, curAnchor);
        }
    } else if (i > e2) {
        // 4. 当 i > e2 ，说明新结点已经比对完，剩下的旧结点直接 unmount 卸载，例子： 旧: a b d c   新：  a b c   那么要把旧的 d 删掉
        for (let j = i; j <= e1; j++) {
            unmount(c1[j]);
        }
    } else {
        // 5. 剩下的情况就是：左右比对完，中间是乱序的 i 既不大于 e1 ，也不大于 e2
        // 做法：采用传统的 diff 算法，但不真的添加和移动，只做标记和删除

        // 下面的代码是根据 patchKeyedChildren2 改造的，注释在 patchKeyedChildren2 中看
        let maxNewIndexSoFar = 0;

        const map = new Map();   // map 记录旧结点信息
        c1.forEach((prev, j) => {
            map.set(prev.key, { prev,j })
        })

        const source = new Array(e2 - i + 1).fill(-1);  // source 记录中间乱序部分 新结点在 旧结点数组中的下标
        let move = false;    // 判断是否真的需要移动 只有当 j < maxNewIndexSoFar 下标开始下降的时候才需要移动
        const toMounted = [];     // 特例：当新结点数组都是升序的，但是中间有结点需要插入，由于都是升序，所以 move = false,不会进入到，后面的最长上升子序列算法中
        for (let k = 0; k < c2.length; k++) {
            const next = c2[k];
            if (map.has(next.key)) {
                const { prev,j } = map.get(next.key);
                patch(prev, next, container, anchor);
                if (j < maxNewIndexSoFar) {
                    move = true;
                } else {
                    maxNewIndexSoFar = j;
                }
                source[k] = j;
                map.delete(next.key); 
            } else {
                // 处理特例 例子: 旧： a b c   新： a x b y c  那么 move 一直都为 false, x y 最后都没机会添加进去，所以把要添加的结点保存在一个数组里
                toMounted.push(k + i);   // 把要添加的结点的位置下标保存起来，后面再统一 mount 添加
            }
        }


        map.forEach(({ prev }) => {
            unmount(prev);
        })

        if(move) {
            // 5.需要移动，则采用新的最长上升子序列算法
            const seq = getSequence(); // 返回值为：所有不需要动的结点的下标
            let j = seq.length - 1;

            // 从后往前看
            for(let k = source.length - 1; k >= 0;k--) { 
                if (seq[j] == k) {
                    // 不用移动
                    j--;
                } else {
                    const pos = k + i;   // 当前结点的位置，要加上 i，因为 source 只是中间乱序的部分
                    const nextPos = k + 1;  // 下一个结点的位置，因为要插入到下一个结点的前面
                    const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor; // 如果下一个结点存在那么就是下个结点的 el ，不存在就直接用 anchor 插入到容器的最末尾
                    
                    if(source[k] == -1) {
                        // 添加，说明新结点没有找到对应旧结点，所以要 mount 添加该新结点
                        patch(null, c2[pos], container, curAnchor);
                    } else {
                        // 移动
                        container.insertBefore(c2[pos].el, curAnchor);
                    }
                }
            }
        } else if (toMounted.length) {
            // 6. 特殊情况：不需要移动，但还有未添加的元素
            // 处理特例,把中间要添加的结点，mount 添加起来
            for (let k = toMounted.length - 1; k >= 0;k--) {
                const pos = toMounted[k];
                const nextPos = pos + 1;
                const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor;
                // mount 添加
                patch(null, c2[pos], container, curAnchor);
            }
        }
    }
}

// 最长上升子序列算法
function getSequence() {

}