import { camelize } from "../utils";
import { NodeTypes, ElementTypes, createRoot } from "./ast";
import { isVoidTag, isNativeTag } from "./index";

// 解析过程中的要点就是：边解析边删除，用 advanceBy() 所以要解析的一直都是从下标 0 开始的
export function parse(content) {
    const context = createParserContext(content);   // 配置上下文
    const children = parseChildren(context);
    console.log(children);
    return createRoot(children);
}

function createParserContext(content) {
    return {
        options: {
            delimiters: ['{{','}}'],       // 插值的模板是可配置的
            isVoidTag,      // 判断自闭合标签
            isNativeTag    // 判断原始标签
        },
        source: content     // 模板字符串
    }
}

function parseChildren(context) {
    const nodes = [];    // 存放解析出来的节点

    while(!isEnd(context)) {
        const s = context.source;
        let node;
        if(s.startsWith(context.options.delimiters[0])) {
            // 解析插值节点
            node = parseInterpolation(context);
        } else if (s[0] === '<') {
            // 解析元素节点
            node = parseElement(context);
        } else {
            // 解析文本节点
            node = parseText(context);
        }
        nodes.push(node);
    }

    // 优化有空格的时候，是要压缩成1个还是要删除， 优化 whiteSpaces
    let removedWhiteSpaces = false;

    for(let i = 0;i < nodes.length;i++) {
        const node = nodes[i];
        if(node.type === NodeTypes.TEXT) {
            // 区分文本节点是否全是空白
            if(/[^\t\r\f\n ]/.test(node.content)) {
                // 文本中有一些字符，把空格压缩成一个  例如： a        b v  
                node.content = node.content.replace(/[\t\r\f\n ]+/g, ' ');
            } else {
                // 文本节点全是空白
                const prev = nodes[i - 1];
                const next = nodes[i + 1];

                // 同时要 满足全是空白节点且前后节点都是 标签元素节点 而且有换行符才能把该节点删除 说明此时的情况是 
                // <span>a</span>
                // <span>b</span>
                if(!prev || !next || (prev.type === NodeTypes.ELEMENT && next.type === NodeTypes.ELEMENT && /[\r\n]/.test(node.content))) {
                    removedWhiteSpaces = true;
                    nodes[i] = null;
                } else {
                    // 如果没有换行符，那就压缩空白节点为一个空格  例如情况为： <span>a</span>     <span>b</span>  中间还是会保留一个空格的
                    node.content = ' ';
                }
            }
        }
    }

    // 有需要删除的节点时才删除，没有就直接返回
    return removedWhiteSpaces ? nodes.filter(Boolean) : nodes;
}

// 解析插值  {{ name }}
function parseInterpolation(context) {
    const [open, close] = context.options.delimiters;   // 取出 {{ 和 }}

    advanceBy(context, open.length);  // 去掉 {{
    
    const closeIndex = context.source.indexOf(close);

    const content = parseTextData(context, closeIndex).trim();  // 得到插值表达式中的文本信息，并在 context.source 中去掉，同时对返回的 content 首尾去除空格

    advanceBy(context, close.length);   // 去掉 }}

    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content,
            isStatic: false,          // 不一定是静态的，因为插值中间也可以是表达式 {{ a + b }}
        }
    }
}

// 解析标签 <div id='aaa'>hello {{ name }}</div>
function parseElement(context) {
    // parseTag (start)
    const element = parseTag(context);
    if(element.isSelfClosing || context.options.isVoidTag(element.tag)) {   // 如果是自闭合标签就可以直接返回了，下面的部分不用解析了
        return element;
    }

    // parseChildren 解析标签中的内容
    element.children = parseChildren(context);
    
    // parseTag (end)   目的是为了把 </div> 删掉
    parseTag(context);

    return element;
}

// 封装一下解析标签 <div id='aaa'>hello {{ name }}</div>
function parseTag(context) {
    const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
    const tag = match[1];  // 分组的第二个，其实也就是匹配标签名的地方  div

    advanceBy(context, match[0].length);    // 删掉匹配到的标签
    advanceSpaces(context);    // 删除剩下的空格

    const { props, directives } = parseAttributes(context);

    // 前面已经删除了标签头部以及属性部分
    const isSelfClosing = context.source.startsWith('/>');
    advanceBy(context, isSelfClosing ? 2 : 1);

    const tagType = isComponent(tag, context) ? ElementTypes.COMPONENT : ElementTypes.ELEMENT;

    return  {
        type: NodeTypes.ELEMENT,
        tag,    // 标签名
        tagType,    // 是组件还是原始标签
        props,     // 属性节点数组
        directives,    // 指令节点数组
        isSelfClosing,   // 是否自闭合标签
        children: [],
    }
}

function isComponent(tag, context) {
    return !context.options.isNativeTag(tag);
}

// 封装一下解析标签中的 属性 id='aaa' 和 指令 v-if='ok'
// 解析所有属性，放在数组里返回
function parseAttributes(context) {
    const props = [];
    const directives = [];

    while(context.source.length && !context.source.startsWith('>') && !context.source.startsWith('/>')) {
        let attr = parseAttribute(context);        // 解析单个属性
        if(attr.type === NodeTypes.ATTRIBUTE) {
            props.push(attr);
        } else {
            directives.push(attr);
        }
    }
    return { props, directives };
}

// 解析单个属性节点
function parseAttribute(context) {
    const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
    const name = match[0];        // 取出属性名，例如： id  class ...

    advanceBy(context, name.length);
    advanceSpaces(context);          // 删掉属性名以及前后的空格

    let value;  // 解析等于号后面的属性值
    if(context.source[0] == '=') {      // 当第一个为 = 号时，解析属性的值，因为有可能只是属性名而已 例如：checked
        advanceBy(context,1);
        advanceSpaces(context);
        value = parseAttributeValue(context);
        advanceSpaces(context);     // 获取完值后，后面也有空格，也要删掉
    }

    // 如果是指令节点
    if(/^(:|@|v-)/.test(name)) {
        let dirName, argContent;

        if(name[0] === ':') {
            dirName = 'bind';
            argContent = name.slice(1);   // 去除掉 : 之后的都是指令名
        } else if (name[0] === '@') {
            dirName = 'on';
            argContent = name.slice(1);
        } else if (name.startsWith('v-')) {
            [dirName, argContent] = name.slice(2).split(':');
        }

        return {
            type: NodeTypes.DIRECTIVE,
            name: dirName,
            exp: value && {    // 指令的内容 = 号后面的内容
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: value.content,
                isStatic: false,
            },
            arg: argContent && {     // 指令名  click mousemove 或者自定义的 :myClass 中的 myClass
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: camelize(argContent),   // 把指令名转换为驼峰形式
                isStatic: true,
            }
        }
    }

    // 属性节点
    return {
        type: NodeTypes.ATTRIBUTE,
        name,
        value: value && {
            type: NodeTypes.TEXT,
            content: value.content
        }
     }
}

function parseAttributeValue(context) {
    const quote = context.source[0];    // 有可能是单引号也可能是双引号
    advanceBy(context, 1);

    const endIndex = context.source.indexOf(quote);

    const content = parseTextData(context, endIndex);  // 取出并删除属性值

    advanceBy(context, 1);   // 最后一个引号删除

    return { content };
}

// 缺陷：不支持文本节点中带 < 号，例如： a < b
function parseText(context) {
    // 有三种情况是结束标志，1. 遇到 < 说明遇到闭合标签了  2.遇到 {{ 说明后面是插值节点了  
    // 3. 内容结束了，就是context.source.length  看哪种情况最先出现，把 endIndex 设置为最先出现的位置 
    const endTokens = ['<', context.options.delimiters[0]];

    let endIndex = context.source.length;

    for(let i = 0;i < endTokens.length; i++) {
        let index = context.source.indexOf(endTokens[i],1);
        if(index < endIndex && index !== -1) {
            endIndex = index;
        }
    }

    const content = parseTextData(context, endIndex);

    return {
        type: NodeTypes.TEXT,
        content,
    }
}

// 封装一下截取文本内容的函数
function parseTextData(context, length) {
    const text = context.source.slice(0, length);    // 截取中间的字符得到文本内容
    advanceBy(context, length);   // 把解析出来的部分裁剪掉
    return text;
}

function isEnd(context) {
    const s = context.source;
    return s.startsWith('</') || !s;   // 当遇到标签的闭合符号 </ 以及 s 为空时说明解析要结束了
}

// 从头部开始,固定长度开始裁剪
function advanceBy(context, numberOfCharacters) {
    context.source = context.source.slice(numberOfCharacters);
}

// 把空格删掉
function advanceSpaces(context) {
    const match = /^[\t\r\n\f ]+/.exec(context.source);
    if(match) {
        advanceBy(context, match[0].length);  // 把空格删掉
    }
}