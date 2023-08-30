// 组件就是一个 vnode  type是对象的时候，例子：
// const Component = {    // 这就是 .vue 组件中配置的组件信息
//     props: ['foo'],     // 1. 这个 props 就是接收从父组件传过来的数据 
//     render(ctx) {      // 手写的 template 
//         return h('div', { class: 'a', id: ctx.bar }, ctx.foo);
//     },
// }
// const vnodeProps = {    // 2. 这个 vnodeProps 是父组件调用子组件时写在子组件身上的属性
//     foo: 'foo',
//     bar: 'bar',
// };
// const vnode = h(Component, vnodeProps);   // Component 是 type (代替之前的 'div' 这些标签)
// render(vnode, document.body);

// updateProps()   这里是 initProps()

import {
    reactive,
    effect
} from '../reactive'
import { queueJob } from './scheduler';
import {
    normalizeVnode
} from './vnode';

function initProps(instance, vnode) {
    const {
        type: Component,
        props: vnodeProps
    } = vnode;

    // 设置默认值为空
    const props = (instance.props = {});
    const attrs = (instance.attrs = {});

    // 判断父节点传过来的属性，如果有在 Component.props 中有则放到 props 里，没有则放到 attrs 里
    for (const key in vnodeProps) {
        // 简单的把 props 只设定为数组
        if (Component.props?.includes(key)) {
            props[key] = vnodeProps[key];
        } else {
            attrs[key] = vnodeProps[key];
        }
    }

    // vue 中 props 是响应式的
    instance.props = reactive(instance.props);
}
export function mountComponent(vnode, container, anchor, patch) {
    const {
        type: Component
    } = vnode;

    // 声明组件实例,把实例放到 vnode 上，后续好调用 update 方法更新
    const instance = (vnode.component = {
        props: null,
        attrs: null,
        setupState: null, // 判断是否有 setup 函数，赋值为其返回值
        ctx: null, // 是模板渲染时的参数 render(ctx)
        subTree: null, // 保存上次结点，以便更新操作
        isMounted: false, // 判断是否第一次加载
        update: null, // 更新函数
        next: null,  // 判断是主动更新还是被动更新（存储 n2）
    });

    initProps(instance, vnode);

    // setup 函数接收两个参数，一个是 props ,一个是上下文对象 context = { attrs, slots, emit, expose }, 这里简化为只有 attrs
    // setup 不一定有，要看定义 Component 的时候是否有定义
    instance.setupState = Component.setup?.(instance.props, {
        attrs: instance.attrs
    })

    instance.ctx = {
        ...instance.props,
        ...instance.setupState
    }

    // 通过 effct 包裹，这样一旦有响应式变量发生改变的时候，都会触发 update 函数
    instance.update = effect(() => {
        // update 跟 mounted 其实很像，只是就是 patch 新旧结点而已，所以设置一个标记 isMounted 判断，然后将二者整合在一起，同时由于 effect 它首次是会执行的，刚好就是 mount
        if (!instance.isMounted) {
            // mount  执行组件中的 render 函数，渲染出模板,得到虚拟dom vnode
            const subTree = (instance.subTree = normalizeVnode(Component.render(instance.ctx)));
            fallThrough(instance, subTree);

            // 从 render.js 中传过来的 patch 函数，对 vnode 进行 mount 加载
            patch(null, subTree, container, anchor);
            vnode.el = subTree.el;
            instance.isMounted = true;
        } else {
            // update 更新
            if(instance.next) {
                // 被动更新：别的组件发生改变，自己的相对应变量也要发生改变
                // 这里主要的点是要获取到 n2 结点，不然 vnode 一直都是 n1 （初始结点），因为 function updateComponent(n1,n2) 是直接调用实例中的 update 函数，没有传参的过程
                // 然后把所有 props 属性都要重新初始化一遍
                vnode = instance.next;
                instance.next = null;  // 清空，以防下次一直进入
                initProps(instance, vnode);
                instance.ctx = {
                    ...instance.props,
                    ...instance.setupState
                }
            } 
            // 主动更新：自己组件内部发生改变
            const prev = instance.subTree;
            const subTree = (instance.subTree = normalizeVnode(Component.render(instance.ctx)));
            fallThrough(instance, subTree);
            patch(prev, subTree, container, anchor);
            vnode.el = subTree.el;
        }
    },{
        scheduler: queueJob,   // 调度函数，复用 computed 的调度，让它是 lazy 的，调度结束后再进行更新，这样可以避免，每次值发生变化就得重新 render 一遍
    })
}

// 只是提取公共部分，简化代码而已
function fallThrough(instance, subTree) {
    // 如果有 attrs 的话，就把属性挂载到根节点上
    if (Object.keys(instance.attrs).length) {
        subTree.props = {
            ...subTree.props,
            ...instance.attrs,
        }
    }
}