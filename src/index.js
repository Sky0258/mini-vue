import {
    render,
    h,
    Text,
    Fragment
} from "./runtime";

import { ref } from './reactive'
// const vnode = h(
//     'div',
//     {
//         class: 'a b',
//         style: {
//             border: '1px solid',
//             fontSize: '14px',
//         },
//         onClick: () => console.log('click'),
//         id: 'foo',
//         checked: '',
//         custom: false,
//     },
//     [
//         h('ul',null, [
//             h('li', { style: { color: 'red'}} , 1),
//             h('li', null , 2),
//             h('li', { style: { color: 'blue'}} , 3),
//             h(Fragment, null, [h('li', null, '4') , h('li')]),
//             h('li', null ,[h(Text, null, 'hello world')]),
//         ])
//     ]
// );
// render(vnode, document.body);

// render(
//     h('ul', null, [
//         h('li', null, 'first'),
//         h(Fragment, null, []),
//         h('li', null, 'last'),
//     ]),
//     document.body
// );

const Comp = {
    setup() {
        const count = ref(0);
        const add = () => count.value++;
        return {
            count,
            add,
        };
    },
    render(ctx) {
        return [
            h('div', null, ctx.count.value),
            h('button', {
                onClick: ctx.add,
            },'add')
        ]
    }
}
const vnode = h(Comp);
render(vnode, document.body);