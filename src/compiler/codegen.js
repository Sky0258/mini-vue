import { capitalize } from "../utils";
import {
    ElementTypes,
    NodeTypes
} from "./ast";

export function generate(ast) {
    return `
    with(ctx) {
        const { h, Text, Fragment, renderList,resolveComponent } = MiniVue;
        return ${traverseNode(ast)}
    }`;
}

function traverseNode(node, parent) {
    switch (node.type) {
        case NodeTypes.ROOT:
            if(node.children.length === 1) {
                return traverseNode(node.children[0], node);
            }
            const result = traverseChildren(node);
            return result;
        case NodeTypes.ELEMENT:
            return resolveElementASTNode(node, parent);     // 元素节点时，要先处理指令，例如 v-for v-if 会影响节点的渲染
        case NodeTypes.INTERPOLATION:
            return createTextVNode(node.content);       // 插值节点跟文本节点合并了，因为都是 Text，只是 child 是字符串或者变量的区别
        case NodeTypes.TEXT:
            return createTextVNode(node);
    }
}

function createTextVNode(node) {
    const child = createText(node);
    return `h(Text, null, ${child})`;
}

function createText( { isStatic = true, content = ''} = {}) {
    return isStatic ? JSON.stringify(content) : content;
}

// 处理特殊指令（会影响 dom 节点结构的指令）的函数
function resolveElementASTNode(node, parent) {
    // 处理 v-if 情况
    // <h1 v-if="show"></h1>
    // <h2 v-else-if="show1"></h2>
    // <h3 v-else></h3>
    // 预期结果： show ? h('h1') : h('h2');

    const ifNode = pluck(node.directives, 'if') || pluck(node.directives, 'else-if');
    if(ifNode) {
        const { exp } = ifNode;
        let condition = exp.content;     // 判断条件
        let consequent = resolveElementASTNode(node, parent);  // 成立时,递归判断有没有其他的 v-for / v-if ,如果没有其实就是返回 createElementVNode(node)
        let alternate;      // 失败时，也就是返回 'h(Text, null, '');'
        
        const { children } = parent;
        let i = children.findIndex((child) => child === node) + 1;
        // 循环找到 v-else 节点，因为有可能中间有空格，所以循环遍历兄弟节点，遇到空格的就跳过
        for(;i < children.length;i++) {
            const sibling = children[i];
            if(sibling.type === NodeTypes.TEXT && !sibling.content.trim()) {
                children.splice(i, 1);
                i--;
                continue;
            }
            if(sibling.type === NodeTypes.ELEMENT) {
                if(pluck(sibling.directives, 'else')) {
                    alternate = resolveElementASTNode(sibling, parent);
                    children.splice(i, 1);
                }else if(pluck(sibling.directives, 'else-if', false)) {
                    alternate = resolveElementASTNode(sibling, parent);
                    children.splice(i, 1);
                }
            }

            break;
        }
        return `${condition} ? ${consequent} : ${alternate || createTextVNode()}`
    }

    // 处理 v-for 情况
    const forNode = pluck(node.directives, 'for');
    if(forNode) {
        // （item, index) in items
        const { exp } = forNode;
        const [args, source] = exp.content.split(/\sin\s|\sof\s/);
        return `h(Fragment, null, renderList(${source.trim()}, ${args.trim()} => ${resolveElementASTNode(node, parent)}))`;
    }
    return createElementVNode(node);
}

function pluck(directives, name, remove = true) {
    const index = directives.findIndex((dir) => dir.name === name);

    const dir = directives[index];
    if(index > -1 && remove) {
        directives.splice(index, 1);
    }

    return dir;
}

function createElementVNode(node) {
    const { children, tagType } = node;
    const tag = tagType === ElementTypes.ELEMENT ? JSON.stringify(node.tag) : `resolveComponent("${node.tag}")`;  // 判断节点是普通节点还是组件

    // 处理 v-model
    // <input v-model="test" />
    // vue2 版本上本质上就是增加两个指令，vue3改成了自定义指令，这里是用 vue2 的原理
    // <input :value = "test" @input = "($event) => test = $event.target.value" />
    const vModel = pluck(node.directives, 'model');
    if(vModel) {
        node.directives.push({
            type: NodeTypes.DIRECTIVE,
            name: 'bind',
            exp: vModel.exp,
            arg: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: 'value',
                isStatic: true,
            }
        },
        {
            type: NodeTypes.DIRECTIVE,
            name: 'on',
            exp: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: `($event) => ${vModel.exp.content} = $event.target.value`,
                isStatic: false,
            },
            arg: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: 'input',
                isStatic: true,
            }
        })
    }

    const propArr = createPropArr(node);

    const propStr = propArr.length ? `{ ${propArr.join(', ')} }` : 'null';

    if(!children.length) {
        if(propStr === 'null') {
            return `h(${tag})`;
        }
        return `h(${tag}, ${propStr})`;
    }

    let childrenStr = traverseChildren(node);

    return `h(${tag}, ${propStr}, ${childrenStr})`;
}

function createPropArr(node) {
    const { props, directives } = node;
    return [...props.map((prop) => `${prop.name}: ${createText(prop.value)}`),...directives.map((dir) => {
        switch (dir.name) {
            case 'bind':
                return `${dir.arg.content}: ${createText(dir.exp)}`;
            case 'on': 
                const eventName = `on${capitalize(dir.arg.content)}`;
                let exp = dir.exp.content;
                // 处理绑定的函数如果有参数的话，要包装成 ($event) => foo(bar, i)  因为有默认参数 $event
                // 通过正则判断是否有括号以及括号内是否有内容
                if(/\([^)]*?\)$/.test(exp) && !exp.includes('=>')) {
                    exp = `$event => (${exp})`;
                }
                return `${eventName}: ${exp}`;
            case 'html': 
                return `innerHtml: ${createText(dir.exp)}`;
            default:
                return `${dir.name}: ${createText(dir.exp)}`;
        }
    })];
}

function traverseChildren(node) {
    const { children } = node;

    if(children.length === 1) {
        const child = children[0];
        if(child.type === NodeTypes.TEXT) {
            return createText(child);
        }
        if(child.type === NodeTypes.INTERPOLATION) {
            return createText(child.content);
        }
    }

    const results = [];
    for(let i = 0;i < children.length; i++) {
        const child = children[i];
        results.push(traverseNode(child, node));
    }

    return `[${results.join(', ')}]`
}