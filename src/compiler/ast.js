// 枚举类型，总共有6种类型的节点
export const NodeTypes = {
    ROOT: 'ROOT',
    ELEMENT: 'ELEMENT',    // 元素节点
    TEXT: 'TEXT',          // 文本节点
    SIMPLE_EXPRESSION: 'SIMPLE_EXPRESSION',  // 表达式节点
    INTERPOLATION: 'INTERPOLATION',     // 插值
    ATTRIBUTE: 'ATTRIBUTE',      // 属性节点
    DIRECTIVE: 'DIRECTIVE'       // 指令节点
}

export const ElementTypes = {
    ELEMENT: 'ELEMENT',
    COMPONENT: 'COMPONENT'
};

export function createRoot(children) {
    return {
        type: NodeTypes.ROOT,
        children
    }
}