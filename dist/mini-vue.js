/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/compiler/ast.js":
/*!*****************************!*\
  !*** ./src/compiler/ast.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ElementTypes: () => (/* binding */ ElementTypes),
/* harmony export */   NodeTypes: () => (/* binding */ NodeTypes),
/* harmony export */   createRoot: () => (/* binding */ createRoot)
/* harmony export */ });
// 枚举类型，总共有6种类型的节点
const NodeTypes = {
    ROOT: 'ROOT',
    ELEMENT: 'ELEMENT',    // 元素节点
    TEXT: 'TEXT',          // 文本节点
    SIMPLE_EXPRESSION: 'SIMPLE_EXPRESSION',  // 表达式节点
    INTERPOLATION: 'INTERPOLATION',     // 插值
    ATTRIBUTE: 'ATTRIBUTE',      // 属性节点
    DIRECTIVE: 'DIRECTIVE'       // 指令节点
}

const ElementTypes = {
    ELEMENT: 'ELEMENT',
    COMPONENT: 'COMPONENT'
};

function createRoot(children) {
    return {
        type: NodeTypes.ROOT,
        children
    }
}

/***/ }),

/***/ "./src/compiler/codegen.js":
/*!*********************************!*\
  !*** ./src/compiler/codegen.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   generate: () => (/* binding */ generate)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _ast__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ast */ "./src/compiler/ast.js");



function generate(ast) {
    return `
    with(ctx) {
        const { h, Text, Fragment, renderList } = MiniVue;
        return ${traverseNode(ast)}
    }`;
}

function traverseNode(node) {
    switch (node.type) {
        case _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.ROOT:
            if(node.children.length === 1) {
                return traverseNode(node.children[0]);
            }
            const result = traverseChildren(node);
            return result;
        case _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.ELEMENT:
            return resolveElementASTNode(node);     // 元素节点时，要先处理指令，例如 v-for v-if 会影响节点的渲染
        case _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.INTERPOLATION:
            return createTextVNode(node.content);       // 插值节点跟文本节点合并了，因为都是 Text，只是 child 是字符串或者变量的区别
        case _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.TEXT:
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
function resolveElementASTNode(node) {
    // 处理 v-for 情况
    const forNode = pluck(node.directives, 'for');
    if(forNode) {
        // （item, index) in items
        const { exp } = forNode;
        const [args, source] = exp.content.split(/\sin\s|\sof\s/);
        return `h(Fragment, null, renderList(${source.trim()}, ${args.trim()} => ${createElementVNode(node)}))`;
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
    const { children } = node;
    const tag = JSON.stringify(node.tag);  // tag 转成字符串

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
                const eventName = `on${(0,_utils__WEBPACK_IMPORTED_MODULE_0__.capitalize)(dir.arg.content)}`;
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
        if(child.type === _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.TEXT) {
            return createText(child);
        }
        if(child.type === _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.INTERPOLATION) {
            return createText(child.content);
        }
    }

    const results = [];
    for(let i = 0;i < children.length; i++) {
        const child = children[i];
        results.push(traverseNode(child));
    }

    return `[${results.join(', ')}]`
}

/***/ }),

/***/ "./src/compiler/compile.js":
/*!*********************************!*\
  !*** ./src/compiler/compile.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   compile: () => (/* binding */ compile)
/* harmony export */ });
/* harmony import */ var _parse__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./parse */ "./src/compiler/parse.js");
/* harmony import */ var _codegen__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./codegen */ "./src/compiler/codegen.js");



function compile(template) {
    const ast = (0,_parse__WEBPACK_IMPORTED_MODULE_0__.parse)(template);
    return (0,_codegen__WEBPACK_IMPORTED_MODULE_1__.generate)(ast);
}

/***/ }),

/***/ "./src/compiler/index.js":
/*!*******************************!*\
  !*** ./src/compiler/index.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NodeTypes: () => (/* reexport safe */ _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes),
/* harmony export */   compile: () => (/* reexport safe */ _compile__WEBPACK_IMPORTED_MODULE_2__.compile),
/* harmony export */   isNativeTag: () => (/* binding */ isNativeTag),
/* harmony export */   isVoidTag: () => (/* binding */ isVoidTag),
/* harmony export */   parse: () => (/* reexport safe */ _parse__WEBPACK_IMPORTED_MODULE_0__.parse)
/* harmony export */ });
/* harmony import */ var _parse__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./parse */ "./src/compiler/parse.js");
/* harmony import */ var _ast__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ast */ "./src/compiler/ast.js");
/* harmony import */ var _compile__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./compile */ "./src/compiler/compile.js");
// 枚举判断是否为原始标签以及是否为自闭合标签
const HTML_TAGS =
  'html,body,base,head,link,meta,style,title,address,article,aside,footer,' +
  'header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,div,dd,dl,dt,figcaption,' +
  'figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,' +
  'data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,s,samp,small,span,strong,sub,sup,' +
  'time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,' +
  'canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,' +
  'th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,' +
  'option,output,progress,select,textarea,details,dialog,menu,' +
  'summary,template,blockquote,iframe,tfoot';

const VOID_TAGS =
  'area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr';

function makeMap(str) {
  const map = str
    .split(',')
    .reduce((map, item) => ((map[item] = true), map), Object.create(null));
  return (val) => !!map[val];
}

const isVoidTag = makeMap(VOID_TAGS);
const isNativeTag = makeMap(HTML_TAGS);





/***/ }),

/***/ "./src/compiler/parse.js":
/*!*******************************!*\
  !*** ./src/compiler/parse.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   parse: () => (/* binding */ parse)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _ast__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ast */ "./src/compiler/ast.js");
/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./index */ "./src/compiler/index.js");




// 解析过程中的要点就是：边解析边删除，用 advanceBy() 所以要解析的一直都是从下标 0 开始的
function parse(content) {
    const context = createParserContext(content);   // 配置上下文
    const children = parseChildren(context);
    return (0,_ast__WEBPACK_IMPORTED_MODULE_1__.createRoot)(children);
}

function createParserContext(content) {
    return {
        options: {
            delimiters: ['{{','}}'],       // 插值的模板是可配置的
            isVoidTag: _index__WEBPACK_IMPORTED_MODULE_2__.isVoidTag,      // 判断自闭合标签
            isNativeTag: _index__WEBPACK_IMPORTED_MODULE_2__.isNativeTag    // 判断原始标签
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
        if(node.type === _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.TEXT) {
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
                if(!prev || !next || (prev.type === _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.ELEMENT && next.type === _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.ELEMENT && /[\r\n]/.test(node.content))) {
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
        type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.INTERPOLATION,
        content: {
            type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.SIMPLE_EXPRESSION,
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

    const tagType = isComponent(tag, context) ? _ast__WEBPACK_IMPORTED_MODULE_1__.ElementTypes.COMPONENT : _ast__WEBPACK_IMPORTED_MODULE_1__.ElementTypes.ELEMENT;

    return  {
        type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.ELEMENT,
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
        if(attr.type === _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.ATTRIBUTE) {
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
            type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.DIRECTIVE,
            name: dirName,
            exp: value && {    // 指令的内容 = 号后面的内容
                type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.SIMPLE_EXPRESSION,
                content: value.content,
                isStatic: false,
            },
            arg: argContent && {     // 指令名  click mousemove 或者自定义的 :myClass 中的 myClass
                type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.SIMPLE_EXPRESSION,
                content: (0,_utils__WEBPACK_IMPORTED_MODULE_0__.camelize)(argContent),   // 把指令名转换为驼峰形式
                isStatic: true,
            }
        }
    }

    // 属性节点
    return {
        type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.ATTRIBUTE,
        name,
        value: value && {
            type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.TEXT,
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
        type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.TEXT,
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

/***/ }),

/***/ "./src/reactivity/computed.js":
/*!************************************!*\
  !*** ./src/reactivity/computed.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   computed: () => (/* binding */ computed)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _effect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./effect */ "./src/reactivity/effect.js");



function computed(getterOrOption) {
    let getter, setter;

    if((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isFunction)(getterOrOption)) {
        getter = getterOrOption;
        setter = () => {
            console.warn('computed is readonly');
        };
    }else {
        getter = getterOrOption.get;
        setter = getterOrOption.set;
    }

    return new ComputedImpl(getter, setter);
}

class ComputedImpl {
    constructor(getter, setter) {
        this._setter = setter;
        this._value = undefined;
        this._dirty = true;
        this.effect = (0,_effect__WEBPACK_IMPORTED_MODULE_1__.effect)(getter, {
            lazy: true,
            // 调度函数
            scheduler: () => {
                this._dirty = true;
                (0,_effect__WEBPACK_IMPORTED_MODULE_1__.trigger)(this, 'value');
            },
        })
    }

    get value() {
        if(this._dirty) {
            this._value = this.effect(); // effect返回值 是执行 getter 之后的返回值 
            this._dirty = false;
            (0,_effect__WEBPACK_IMPORTED_MODULE_1__.track)(this, 'value');
        }

        return this._value;
    }

    set value(newValue) {
        this._setter(newValue);
    }
}

/***/ }),

/***/ "./src/reactivity/effect.js":
/*!**********************************!*\
  !*** ./src/reactivity/effect.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   effect: () => (/* binding */ effect),
/* harmony export */   track: () => (/* binding */ track),
/* harmony export */   trigger: () => (/* binding */ trigger)
/* harmony export */ });
// 用栈存储副作用函数，避免嵌套 effect 时，外部 effect 函数失效
const effectStack = [];
// 记录当前执行的副作用函数
let activeEffect;

function effect(fn, options = {}) {
    const effectFn = () => {
        // 以防用户自定义的函数出错，所以要 try catch
        try {
            activeEffect = effectFn;
            effectStack.push(activeEffect);
            return fn();
        } finally {
            effectStack.pop();
            activeEffect = effectStack[effectStack.length - 1];
        }
    };

    if(!options.lazy) {     // 因为 computed 是缓存依赖函数的，等调用了值才执行依赖函数
        effectFn();
    }
    
    // 调度函数(computed)
    effectFn.scheduler = options.scheduler;

    return effectFn;
}

const targetMap = new WeakMap();
// 保存副作用函数中的依赖 （保存依赖）
function track(target,key) {
    if(!activeEffect) {
        return;
    }

    // targetMap(一个WeakMap),键是调用的 target 对象
    let depsMap = targetMap.get(target);
    if(!depsMap) {
        targetMap.set(target,(depsMap = new Map()));
    }

    // 值是 Map , map 的键是 调用的属性 key , 值是副作用函数 （这样就可以把依赖建立起来）
    let deps = depsMap.get(key);
    if(!deps) {
        depsMap.set(key, (deps = new Set()));
    }

    deps.add(activeEffect);  // 添加副作用函数 到 Set 中
}

// 相当于 track 的逆运算，（执行依赖）
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    // target 找不到 说明 target 没有依赖
    if(!depsMap) {
        return;
    }

    // key 找不到 说明 key 没有依赖
    const deps = depsMap.get(key);
    if(!deps) {
        return;
    }

    // 能找得到，就把所有依赖函数都执行一遍
    deps.forEach(effectFn => {
        if(effectFn.scheduler) {
            effectFn.scheduler(effectFn); 
        }else {
            effectFn();
        }
    });
}

/***/ }),

/***/ "./src/reactivity/index.js":
/*!*********************************!*\
  !*** ./src/reactivity/index.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   computed: () => (/* reexport safe */ _computed__WEBPACK_IMPORTED_MODULE_3__.computed),
/* harmony export */   effect: () => (/* reexport safe */ _effect__WEBPACK_IMPORTED_MODULE_0__.effect),
/* harmony export */   isReactive: () => (/* reexport safe */ _reactive__WEBPACK_IMPORTED_MODULE_1__.isReactive),
/* harmony export */   isRef: () => (/* reexport safe */ _ref__WEBPACK_IMPORTED_MODULE_2__.isRef),
/* harmony export */   reactive: () => (/* reexport safe */ _reactive__WEBPACK_IMPORTED_MODULE_1__.reactive),
/* harmony export */   ref: () => (/* reexport safe */ _ref__WEBPACK_IMPORTED_MODULE_2__.ref)
/* harmony export */ });
/* harmony import */ var _effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./effect */ "./src/reactivity/effect.js");
/* harmony import */ var _reactive__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./reactive */ "./src/reactivity/reactive.js");
/* harmony import */ var _ref__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ref */ "./src/reactivity/ref.js");
/* harmony import */ var _computed__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./computed */ "./src/reactivity/computed.js");





/***/ }),

/***/ "./src/reactivity/reactive.js":
/*!************************************!*\
  !*** ./src/reactivity/reactive.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isReactive: () => (/* binding */ isReactive),
/* harmony export */   reactive: () => (/* binding */ reactive)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _effect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./effect */ "./src/reactivity/effect.js");



const proxyMap = new WeakMap(); // 当调用 reactive 的参数对象相同时，返回同一个代理对象 (特例2)
function reactive(target) {
    // 如果不是对象，就原样返回
    if (!(0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(target)) {
        return target;
    }

    // 避免嵌套调用 reactive   reactive(reactive(obj)) 只需要代理一次 (特例1)
    if (isReactive(target)) {
        return target;
    }

    if (proxyMap.has(target)) {
        return proxyMap.get(target); // 当调用 reactive 的参数对象相同时，返回同一个代理对象
    }

    
    const proxy = new Proxy(target, {
        get(target, key, receiver) {
            if (key === '__isReactive') {
                return true;
            }
            const res = Reflect.get(target, key, receiver);
            (0,_effect__WEBPACK_IMPORTED_MODULE_1__.track)(target, key);
            return (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(res) ? reactive(res) : res;  // 深层对象代理（特例4）
            // 当该属性的值也为对象时，同时有副作用函数依赖时，再次进行递归代理
        },
        set(target, key, value, receiver) {
            let oldLength = target.length;
            const oldValue = target[key];

            const res = Reflect.set(target, key, value, receiver);

            // 当新旧值不相同时，确切的发生改变时才触发副作用函数 (特例3)
            if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(oldValue, value)) {
                (0,_effect__WEBPACK_IMPORTED_MODULE_1__.trigger)(target, key);
                if((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(target) && (0,_utils__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(oldLength, target.length)) {  // 当目标为数组时，push 时手动 trigger length (特例5)
                    (0,_effect__WEBPACK_IMPORTED_MODULE_1__.trigger)(target,'length');
                }
            }

            return res;
        }
    })

    proxyMap.set(target, proxy);
    return proxy;
}

function isReactive(target) {
    return !!(target && target.__isReactive);
}

/***/ }),

/***/ "./src/reactivity/ref.js":
/*!*******************************!*\
  !*** ./src/reactivity/ref.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isRef: () => (/* binding */ isRef),
/* harmony export */   ref: () => (/* binding */ ref)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _effect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./effect */ "./src/reactivity/effect.js");
/* harmony import */ var _reactive__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./reactive */ "./src/reactivity/reactive.js");




function ref(value) {
    if(isRef(value)) {
        return value;
    }

    return new RefImpl(value);
}

function isRef(value) {
    return !!(value && value.__isRef);
}

class RefImpl {
    constructor(value) {
        this.__isRef = true;
        this._value = convert(value);
    }

    get value() {
        (0,_effect__WEBPACK_IMPORTED_MODULE_1__.track)(this, 'value');
        return this._value;
    }

    set value(newValue) {
        if((0,_utils__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(newValue, this._value)) {  // 当新旧值不同时，才运行依赖函数
            this._value = convert(newValue);
            (0,_effect__WEBPACK_IMPORTED_MODULE_1__.trigger)(this, 'value');
        }
    }
}

// 判断是否是对象，是对象就调用 reactive ，不是则原样返回
function convert(value) {
    return (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(value) ? (0,_reactive__WEBPACK_IMPORTED_MODULE_2__.reactive)(value) : value;
}

/***/ }),

/***/ "./src/runtime/component.js":
/*!**********************************!*\
  !*** ./src/runtime/component.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   mountComponent: () => (/* binding */ mountComponent)
/* harmony export */ });
/* harmony import */ var _compiler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../compiler */ "./src/compiler/index.js");
/* harmony import */ var _reactivity__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../reactivity */ "./src/reactivity/index.js");
/* harmony import */ var _scheduler__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./scheduler */ "./src/runtime/scheduler.js");
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");
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
    instance.props = (0,_reactivity__WEBPACK_IMPORTED_MODULE_1__.reactive)(instance.props);
}
function mountComponent(vnode, container, anchor, patch) {
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
    
    if(!Component.render && Component.template) {
        let { template } = Component;
        if(template[0] === '#') {
            const el = document.querySelector(template);
            template = el ? el.innerHTML : '';
        }
        const code = (0,_compiler__WEBPACK_IMPORTED_MODULE_0__.compile)(template);
        Component.render = new Function('ctx', code);
    }

    // 通过 effct 包裹，这样一旦有响应式变量发生改变的时候，都会触发 update 函数
    instance.update = (0,_reactivity__WEBPACK_IMPORTED_MODULE_1__.effect)(() => {
        // update 跟 mounted 其实很像，只是就是 patch 新旧结点而已，所以设置一个标记 isMounted 判断，然后将二者整合在一起，同时由于 effect 它首次是会执行的，刚好就是 mount
        if (!instance.isMounted) {
            // mount  执行组件中的 render 函数，渲染出模板,得到虚拟dom vnode
            const subTree = (instance.subTree = (0,_vnode__WEBPACK_IMPORTED_MODULE_3__.normalizeVnode)(Component.render(instance.ctx)));
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
            const subTree = (instance.subTree = (0,_vnode__WEBPACK_IMPORTED_MODULE_3__.normalizeVnode)(Component.render(instance.ctx)));
            fallThrough(instance, subTree);
            patch(prev, subTree, container, anchor);
            vnode.el = subTree.el;
        }
    },{
        scheduler: _scheduler__WEBPACK_IMPORTED_MODULE_2__.queueJob,   // 调度函数，复用 computed 的调度，让它是 lazy 的，调度结束后再进行更新，这样可以避免，每次值发生变化就得重新 render 一遍
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

/***/ }),

/***/ "./src/runtime/createApp.js":
/*!**********************************!*\
  !*** ./src/runtime/createApp.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createApp: () => (/* binding */ createApp)
/* harmony export */ });
/* harmony import */ var ___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! . */ "./src/runtime/index.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");



function createApp(rootComponent) {
    const app = {
        mount(rootContainer) {
            if((0,_utils__WEBPACK_IMPORTED_MODULE_1__.isString)(rootContainer)) {
                rootContainer = document.querySelector(rootContainer);
            }

            // 当没有 render 函数也没有 template 模板时，加载容器里面的内容为 template
            if(!rootComponent.render && !rootComponent.template) {
                rootComponent.template = rootContainer.innerHTML;
            }
            rootContainer.innerHTML = '';    // 要把原本的删掉，避免加载两次

            (0,___WEBPACK_IMPORTED_MODULE_0__.render)((0,___WEBPACK_IMPORTED_MODULE_0__.h)(rootComponent), rootContainer);
        }
    }

    return app;
}

/***/ }),

/***/ "./src/runtime/helpers/renderList.js":
/*!*******************************************!*\
  !*** ./src/runtime/helpers/renderList.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   renderList: () => (/* binding */ renderList)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils */ "./src/utils/index.js");


function renderList(source, renderItem) {
    // v-for 指令中 items 可以有四种不同情况
    // item in items Array
    // item in obj  Object
    // item in 10   Number
    // item in 'abcede'   string

    const nodes = [];
    if((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isNumber)(source)) {
        for(let i = 0;i < source;i++) {
            nodes.push(renderItem(i + 1,i));
        }
    } else if((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isString)(source) || (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(source)) {
        for(let i = 0;i < source;i++) {
            nodes.push(renderItem(source[i],i));
        }
    } else if((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(source)) {
        const keys = Object.keys(source);
        keys.forEach((key, index) => {
            nodes.push(renderItem(source[key], key, index));
        });
    }

    return nodes;
}

/***/ }),

/***/ "./src/runtime/index.js":
/*!******************************!*\
  !*** ./src/runtime/index.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Fragment: () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_0__.Fragment),
/* harmony export */   Text: () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_0__.Text),
/* harmony export */   createApp: () => (/* reexport safe */ _createApp__WEBPACK_IMPORTED_MODULE_3__.createApp),
/* harmony export */   h: () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_0__.h),
/* harmony export */   nextTick: () => (/* reexport safe */ _scheduler__WEBPACK_IMPORTED_MODULE_2__.nextTick),
/* harmony export */   queueJob: () => (/* reexport safe */ _scheduler__WEBPACK_IMPORTED_MODULE_2__.queueJob),
/* harmony export */   render: () => (/* reexport safe */ _render__WEBPACK_IMPORTED_MODULE_1__.render),
/* harmony export */   renderList: () => (/* reexport safe */ _helpers_renderList__WEBPACK_IMPORTED_MODULE_4__.renderList)
/* harmony export */ });
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");
/* harmony import */ var _render__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./render */ "./src/runtime/render.js");
/* harmony import */ var _scheduler__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./scheduler */ "./src/runtime/scheduler.js");
/* harmony import */ var _createApp__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./createApp */ "./src/runtime/createApp.js");
/* harmony import */ var _helpers_renderList__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./helpers/renderList */ "./src/runtime/helpers/renderList.js");






/***/ }),

/***/ "./src/runtime/patchProps.js":
/*!***********************************!*\
  !*** ./src/runtime/patchProps.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   patchProps: () => (/* binding */ patchProps)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
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
// 更新结点 vnode 的 props 
function patchProps(oldProps, newProps, el) {
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
        const prev = oldProps[key];

        if (prev !== next) {
            patchDomProp(prev, next, key, el);
        }
    }

    
    // 移除掉旧 props 中有而新 props 中没有的属性
    for (const key in oldProps) {
        if (key !== 'key' && !(key in newProps)) {
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
                        if (next[styleName] === null || next[styleName] === undefined) {
                            el.style[styleName] = '';
                        }
                    }
                }
            }
            break;
        default:
            if (/^on[^a-z]/.test(key)) {
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
                if (next === '' && (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isBoolean)(el[key])) {
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

/***/ }),

/***/ "./src/runtime/render.js":
/*!*******************************!*\
  !*** ./src/runtime/render.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   render: () => (/* binding */ render)
/* harmony export */ });
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");
/* harmony import */ var _patchProps__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./patchProps */ "./src/runtime/patchProps.js");
/* harmony import */ var _component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./component */ "./src/runtime/component.js");





function render(vnode, container) {
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
    if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.COMPONENT) {
        unmountComponent(vnode);
    } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.FRAGMENT) {
        unmountFragment(vnode);
    } else {
        // 剩下的可以直接使用 removeChild 删除结点
        el.parentNode.removeChild(el);
    }
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

function unmountComponent(vnode) {
    unmount(vnode.component.subTree);
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
    if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.COMPONENT) {
        processComponent(n1, n2, container, anchor);
    } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT) {
        processText(n1, n2, container, anchor);
    } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.FRAGMENT) {
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
    if(n1) {
        // 前面还要判断一下是否真的需要更新  shouldUpdateComponent  Vue是内置，内部自己判断的
        // 因为如果真正用到的那个部分 props 没有更改的话，其实不用被动更新
        updateComponent(n1,n2);
    } else {
        (0,_component__WEBPACK_IMPORTED_MODULE_2__.mountComponent)(n2, container, anchor, patch);
    }
}

function updateComponent(n1,n2) {
    n2.component = n1.component;  // 先继承 n1 的 component, 接下来才可以调用 实例上的 update 函数
    n2.component.next = n2;
    n2.component.update();   // 没有传参过程，所以到 update 中要 vnode 要换成 n2
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
    (0,_patchProps__WEBPACK_IMPORTED_MODULE_1__.patchProps)(null, props, el);

    // 创建挂载 children 结点
    if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT_CHILDREN) {
        mountTextNode(vnode, el);
    } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
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
    (0,_patchProps__WEBPACK_IMPORTED_MODULE_1__.patchProps)(n1.props, n2.props, n2.el);

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
    if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT_CHILDREN) {
        // 重复操作进行合并，一开始应该有 3 个分支的
        if (prevShapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
            unmountChildren(c1);
        }

        if (c1 !== c2) {
            container.textContent = c2;
        }
    } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
        // 当 n2 为 Array 类型，对应 n1 三种类型分别有不同的更新方法
        if (prevShapeFlag & shapeFlag.TEXT_CHILDREN) {
            container.textContent = '';
            mountChildren(c2, container, anchor);
        } else if (prevShapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
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
        } else if (prevShapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
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
        
        for(let j = i;j <= el;j++) {
            const prev = c1[j];
            map.set(prev.key, { prev, j });
        }

        const source = new Array(e2 - i + 1).fill(-1);  // source 记录中间乱序部分 新结点在 旧结点数组中的下标
        let move = false;    // 判断是否真的需要移动 只有当 j < maxNewIndexSoFar 下标开始下降的时候才需要移动
        const toMounted = [];     // 特例：当新结点数组都是升序的，但是中间有结点需要插入，由于都是升序，所以 move = false,不会进入到，后面的最长上升子序列算法中
        for (let k = 0; k < source.length; k++) {
            const next = c2[k + i];
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

// 力扣题目：最长递增子序列
function getSequence(nums) {
    const arr = [nums[0]];
    const position = [0];   // position 记录每个元素在 arr 中出现的位置
    // 从后往前找第一个递减的位置，就是子序列的值的下标  
    // position: [ 0, 0, 0, 1, 1, 2, 3, 3] 从后往前找第一个 3 第一个 2 ... 对应的下标就是子序列元素下标

    for(let i = 1;i < nums.length;i++) {
        if(nums[i] === -1) {
            continue;      // 说明是要 mount 添加的结点
        }
        if(nums[i] > arr[arr.length - 1]) {
            arr.push(nums[i]);
            position.push(arr.length - 1);
        } else {
            let l = 0,r = arr.length - 1;
            while(l <= r) {
                let mid = Math.floor((l + r) / 2);
                if(arr[mid] < nums[i]) {
                    l = mid + 1;
                }else if(arr[mid] > nums[i]){
                    r = mid - 1;
                }else {
                    l = mid;
                    break;
                }
            }
            arr[l] = nums[i];
            position.push(l);
        }
    }

    let cur = position.length;
    for(let i = position.length - 1;i >= 0 && cur > -1;i--) {
        if(position[i] == cur) {
            arr[cur] = nums[i];
            cur--;
        }
    }
    
    return arr;    // 返回子序列真实值
};


/***/ }),

/***/ "./src/runtime/scheduler.js":
/*!**********************************!*\
  !*** ./src/runtime/scheduler.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   nextTick: () => (/* binding */ nextTick),
/* harmony export */   queueJob: () => (/* binding */ queueJob)
/* harmony export */ });
const queue = [];  // 任务队列
let isFlushing = false;  // 判断是否正在执行
const resolvedPromise = Promise.resolve();    // 新建 Promise
let currentFlushPromise;   // 记录任务队列全部做完返回的 Promise

function nextTick(fn) {
    const p = currentFlushPromise || resolvedPromise;   // 当前任务有在执行时，返回执行后的 Promise, 没有时返回新建的
    return fn ? p.then(fn) : p;
}

function queueJob (job) {
    if(!queue.length || !queue.includes(job)) {   // 相同的任务只需要进入 1 个就行
        queue.push(job);
        queueFlush();
    }
}

// 将队列任务设置为 微任务 异步执行
function queueFlush() {
    if(!isFlushing) {
        isFlushing = true;
        currentFlushPromise = Promise.resolve().then(flushJobs)
    }
}

// 执行任务，清空队列
function flushJobs() {
    try {   // 有些是用户操作，所以用 try 
        for(let i = 0;i < queue.length;i++) {
            const job = queue[i];
            job();     // 执行 job
        }
    } finally {
        isFlushing = false;
        queue.length = 0; // 清空队列
        currentFlushPromise = null;
    }
}

/***/ }),

/***/ "./src/runtime/vnode.js":
/*!******************************!*\
  !*** ./src/runtime/vnode.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Fragment: () => (/* binding */ Fragment),
/* harmony export */   ShapeFlags: () => (/* binding */ ShapeFlags),
/* harmony export */   Text: () => (/* binding */ Text),
/* harmony export */   h: () => (/* binding */ h),
/* harmony export */   normalizeVnode: () => (/* binding */ normalizeVnode)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");


// 用于判断结点类型 (只写了主要的四种类型: dom元素，纯文本，Fragment，组件)
const ShapeFlags = {
    ELEMENT: 1,
    TEXT: 1 << 1,
    FRAGMENT: 1 << 2,
    COMPONENT: 1 << 3,
    TEXT_CHILDREN: 1 << 4,
    ARRAY_CHILDREN: 1 << 5,
    CHILDREN: (1 << 4) | (1 << 5)
};

const Text = Symbol('Text');
const Fragment = Symbol('Fragment');

/**
 * 
 * @param {string | Object | Text | Fragment} type 
 * @param {Object | null} props 
 * @param {string | number | Array | null} children 
 * @returns VNode
 */
function h(type, props, children) {
    let shapeFlag = 0;
    if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isString)(type)) {
        shapeFlag = ShapeFlags.ELEMENT;
    } else if (type === Text) {
        shapeFlag = ShapeFlags.TEXT;
    } else if (type === Fragment) {
        shapeFlag = ShapeFlags.FRAGMENT;
    } else {
        shapeFlag = ShapeFlags.COMPONENT;
    }

    if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isString)(children) || (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isNumber)(children)) {
        shapeFlag |= ShapeFlags.TEXT_CHILDREN;
        children - children.toString();
    } else if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(children)) {
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
function normalizeVnode(result) {
    if((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(result)) {
        return h(Fragment, null, result);
    }
    if((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(result)) {
        // 说明已经是 vnode 结点了
        return result;
    }
    
    // 剩下的只能是 string number
    return h(Text, null, result.toString());
}

/***/ }),

/***/ "./src/utils/index.js":
/*!****************************!*\
  !*** ./src/utils/index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   camelize: () => (/* binding */ camelize),
/* harmony export */   capitalize: () => (/* binding */ capitalize),
/* harmony export */   hasChanged: () => (/* binding */ hasChanged),
/* harmony export */   isArray: () => (/* binding */ isArray),
/* harmony export */   isBoolean: () => (/* binding */ isBoolean),
/* harmony export */   isFunction: () => (/* binding */ isFunction),
/* harmony export */   isNumber: () => (/* binding */ isNumber),
/* harmony export */   isObject: () => (/* binding */ isObject),
/* harmony export */   isString: () => (/* binding */ isString)
/* harmony export */ });
// 工具类判断是否为对象类型
function isObject(target) {
    return typeof target === 'object' && target !== null;
}

// 判断是否为数组
function isArray(target) {
    return Array.isArray(target);
}

// 判断是否为函数
function isFunction(target) {
    return typeof target === 'function';
}

function isString(target) {
    return typeof target === 'string';
}

function isNumber(target) {
    return typeof target === 'number';
}

function isBoolean(target) {
    return typeof target === 'boolean';
}

// 判断值是否发生改变
function hasChanged(oldValue, value) {
    return oldValue !== value && !(Number.isNaN(oldValue) && Number.isNaN(value));  // 新老值不相等，且两个值都不能为 NaN 因为 NaN !== NaN 所以一定放回的是改变
}

// 把字符串转换为驼峰形式
// my-name -> myName
function camelize(str) {
    return str.replace(/-(\w)/g, (_, c) => ( c ? c.toUpperCase() : ''));
}

// 首字母大写
function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MiniVue: () => (/* binding */ MiniVue)
/* harmony export */ });
/* harmony import */ var _compiler_compile__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./compiler/compile */ "./src/compiler/compile.js");
/* harmony import */ var _runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./runtime */ "./src/runtime/index.js");
/* harmony import */ var _reactivity__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./reactivity */ "./src/reactivity/index.js");




const MiniVue = (window.MiniVue = {
  createApp: _runtime__WEBPACK_IMPORTED_MODULE_1__.createApp,
  render: _runtime__WEBPACK_IMPORTED_MODULE_1__.render,
  h: _runtime__WEBPACK_IMPORTED_MODULE_1__.h,
  Text: _runtime__WEBPACK_IMPORTED_MODULE_1__.Text,
  Fragment: _runtime__WEBPACK_IMPORTED_MODULE_1__.Fragment,
  nextTick: _runtime__WEBPACK_IMPORTED_MODULE_1__.nextTick,
  reactive: _reactivity__WEBPACK_IMPORTED_MODULE_2__.reactive,
  ref: _reactivity__WEBPACK_IMPORTED_MODULE_2__.ref,
  computed: _reactivity__WEBPACK_IMPORTED_MODULE_2__.computed,
  effect: _reactivity__WEBPACK_IMPORTED_MODULE_2__.effect,
  compile: _compiler_compile__WEBPACK_IMPORTED_MODULE_0__.compile,
  renderList: _runtime__WEBPACK_IMPORTED_MODULE_1__.renderList
});

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaS12dWUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FDckJBO0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUM5SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUNyUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3hFQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0VBO0FBSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUlBO0FBQ0E7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7OztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDMUdBO0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FDcmRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDUEE7Ozs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDTkE7QUFTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbWluaS12dWUzLy4vc3JjL2NvbXBpbGVyL2FzdC5qcyIsIndlYnBhY2s6Ly9taW5pLXZ1ZTMvLi9zcmMvY29tcGlsZXIvY29kZWdlbi5qcyIsIndlYnBhY2s6Ly9taW5pLXZ1ZTMvLi9zcmMvY29tcGlsZXIvY29tcGlsZS5qcyIsIndlYnBhY2s6Ly9taW5pLXZ1ZTMvLi9zcmMvY29tcGlsZXIvaW5kZXguanMiLCJ3ZWJwYWNrOi8vbWluaS12dWUzLy4vc3JjL2NvbXBpbGVyL3BhcnNlLmpzIiwid2VicGFjazovL21pbmktdnVlMy8uL3NyYy9yZWFjdGl2aXR5L2NvbXB1dGVkLmpzIiwid2VicGFjazovL21pbmktdnVlMy8uL3NyYy9yZWFjdGl2aXR5L2VmZmVjdC5qcyIsIndlYnBhY2s6Ly9taW5pLXZ1ZTMvLi9zcmMvcmVhY3Rpdml0eS9pbmRleC5qcyIsIndlYnBhY2s6Ly9taW5pLXZ1ZTMvLi9zcmMvcmVhY3Rpdml0eS9yZWFjdGl2ZS5qcyIsIndlYnBhY2s6Ly9taW5pLXZ1ZTMvLi9zcmMvcmVhY3Rpdml0eS9yZWYuanMiLCJ3ZWJwYWNrOi8vbWluaS12dWUzLy4vc3JjL3J1bnRpbWUvY29tcG9uZW50LmpzIiwid2VicGFjazovL21pbmktdnVlMy8uL3NyYy9ydW50aW1lL2NyZWF0ZUFwcC5qcyIsIndlYnBhY2s6Ly9taW5pLXZ1ZTMvLi9zcmMvcnVudGltZS9oZWxwZXJzL3JlbmRlckxpc3QuanMiLCJ3ZWJwYWNrOi8vbWluaS12dWUzLy4vc3JjL3J1bnRpbWUvaW5kZXguanMiLCJ3ZWJwYWNrOi8vbWluaS12dWUzLy4vc3JjL3J1bnRpbWUvcGF0Y2hQcm9wcy5qcyIsIndlYnBhY2s6Ly9taW5pLXZ1ZTMvLi9zcmMvcnVudGltZS9yZW5kZXIuanMiLCJ3ZWJwYWNrOi8vbWluaS12dWUzLy4vc3JjL3J1bnRpbWUvc2NoZWR1bGVyLmpzIiwid2VicGFjazovL21pbmktdnVlMy8uL3NyYy9ydW50aW1lL3Zub2RlLmpzIiwid2VicGFjazovL21pbmktdnVlMy8uL3NyYy91dGlscy9pbmRleC5qcyIsIndlYnBhY2s6Ly9taW5pLXZ1ZTMvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vbWluaS12dWUzL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9taW5pLXZ1ZTMvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9taW5pLXZ1ZTMvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9taW5pLXZ1ZTMvLi9zcmMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8g5p6a5Li+57G75Z6L77yM5oC75YWx5pyJNuenjeexu+Wei+eahOiKgueCuVxyXG5leHBvcnQgY29uc3QgTm9kZVR5cGVzID0ge1xyXG4gICAgUk9PVDogJ1JPT1QnLFxyXG4gICAgRUxFTUVOVDogJ0VMRU1FTlQnLCAgICAvLyDlhYPntKDoioLngrlcclxuICAgIFRFWFQ6ICdURVhUJywgICAgICAgICAgLy8g5paH5pys6IqC54K5XHJcbiAgICBTSU1QTEVfRVhQUkVTU0lPTjogJ1NJTVBMRV9FWFBSRVNTSU9OJywgIC8vIOihqOi+vuW8j+iKgueCuVxyXG4gICAgSU5URVJQT0xBVElPTjogJ0lOVEVSUE9MQVRJT04nLCAgICAgLy8g5o+S5YC8XHJcbiAgICBBVFRSSUJVVEU6ICdBVFRSSUJVVEUnLCAgICAgIC8vIOWxnuaAp+iKgueCuVxyXG4gICAgRElSRUNUSVZFOiAnRElSRUNUSVZFJyAgICAgICAvLyDmjIfku6ToioLngrlcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IEVsZW1lbnRUeXBlcyA9IHtcclxuICAgIEVMRU1FTlQ6ICdFTEVNRU5UJyxcclxuICAgIENPTVBPTkVOVDogJ0NPTVBPTkVOVCdcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb290KGNoaWxkcmVuKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHR5cGU6IE5vZGVUeXBlcy5ST09ULFxyXG4gICAgICAgIGNoaWxkcmVuXHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBjYXBpdGFsaXplIH0gZnJvbSBcIi4uL3V0aWxzXCI7XHJcbmltcG9ydCB7XHJcbiAgICBOb2RlVHlwZXNcclxufSBmcm9tIFwiLi9hc3RcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZShhc3QpIHtcclxuICAgIHJldHVybiBgXHJcbiAgICB3aXRoKGN0eCkge1xyXG4gICAgICAgIGNvbnN0IHsgaCwgVGV4dCwgRnJhZ21lbnQsIHJlbmRlckxpc3QgfSA9IE1pbmlWdWU7XHJcbiAgICAgICAgcmV0dXJuICR7dHJhdmVyc2VOb2RlKGFzdCl9XHJcbiAgICB9YDtcclxufVxyXG5cclxuZnVuY3Rpb24gdHJhdmVyc2VOb2RlKG5vZGUpIHtcclxuICAgIHN3aXRjaCAobm9kZS50eXBlKSB7XHJcbiAgICAgICAgY2FzZSBOb2RlVHlwZXMuUk9PVDpcclxuICAgICAgICAgICAgaWYobm9kZS5jaGlsZHJlbi5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cmF2ZXJzZU5vZGUobm9kZS5jaGlsZHJlblswXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdHJhdmVyc2VDaGlsZHJlbihub2RlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICBjYXNlIE5vZGVUeXBlcy5FTEVNRU5UOlxyXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUVsZW1lbnRBU1ROb2RlKG5vZGUpOyAgICAgLy8g5YWD57Sg6IqC54K55pe277yM6KaB5YWI5aSE55CG5oyH5Luk77yM5L6L5aaCIHYtZm9yIHYtaWYg5Lya5b2x5ZON6IqC54K555qE5riy5p+TXHJcbiAgICAgICAgY2FzZSBOb2RlVHlwZXMuSU5URVJQT0xBVElPTjpcclxuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZVRleHRWTm9kZShub2RlLmNvbnRlbnQpOyAgICAgICAvLyDmj5LlgLzoioLngrnot5/mlofmnKzoioLngrnlkIjlubbkuobvvIzlm6DkuLrpg73mmK8gVGV4dO+8jOWPquaYryBjaGlsZCDmmK/lrZfnrKbkuLLmiJbogIXlj5jph4/nmoTljLrliKtcclxuICAgICAgICBjYXNlIE5vZGVUeXBlcy5URVhUOlxyXG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlVGV4dFZOb2RlKG5vZGUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVUZXh0Vk5vZGUobm9kZSkge1xyXG4gICAgY29uc3QgY2hpbGQgPSBjcmVhdGVUZXh0KG5vZGUpO1xyXG4gICAgcmV0dXJuIGBoKFRleHQsIG51bGwsICR7Y2hpbGR9KWA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVRleHQoIHsgaXNTdGF0aWMgPSB0cnVlLCBjb250ZW50ID0gJyd9ID0ge30pIHtcclxuICAgIHJldHVybiBpc1N0YXRpYyA/IEpTT04uc3RyaW5naWZ5KGNvbnRlbnQpIDogY29udGVudDtcclxufVxyXG5cclxuLy8g5aSE55CG54m55q6K5oyH5Luk77yI5Lya5b2x5ZONIGRvbSDoioLngrnnu5PmnoTnmoTmjIfku6TvvInnmoTlh73mlbBcclxuZnVuY3Rpb24gcmVzb2x2ZUVsZW1lbnRBU1ROb2RlKG5vZGUpIHtcclxuICAgIC8vIOWkhOeQhiB2LWZvciDmg4XlhrVcclxuICAgIGNvbnN0IGZvck5vZGUgPSBwbHVjayhub2RlLmRpcmVjdGl2ZXMsICdmb3InKTtcclxuICAgIGlmKGZvck5vZGUpIHtcclxuICAgICAgICAvLyDvvIhpdGVtLCBpbmRleCkgaW4gaXRlbXNcclxuICAgICAgICBjb25zdCB7IGV4cCB9ID0gZm9yTm9kZTtcclxuICAgICAgICBjb25zdCBbYXJncywgc291cmNlXSA9IGV4cC5jb250ZW50LnNwbGl0KC9cXHNpblxcc3xcXHNvZlxccy8pO1xyXG4gICAgICAgIHJldHVybiBgaChGcmFnbWVudCwgbnVsbCwgcmVuZGVyTGlzdCgke3NvdXJjZS50cmltKCl9LCAke2FyZ3MudHJpbSgpfSA9PiAke2NyZWF0ZUVsZW1lbnRWTm9kZShub2RlKX0pKWA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudFZOb2RlKG5vZGUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwbHVjayhkaXJlY3RpdmVzLCBuYW1lLCByZW1vdmUgPSB0cnVlKSB7XHJcbiAgICBjb25zdCBpbmRleCA9IGRpcmVjdGl2ZXMuZmluZEluZGV4KChkaXIpID0+IGRpci5uYW1lID09PSBuYW1lKTtcclxuXHJcbiAgICBjb25zdCBkaXIgPSBkaXJlY3RpdmVzW2luZGV4XTtcclxuICAgIGlmKGluZGV4ID4gLTEgJiYgcmVtb3ZlKSB7XHJcbiAgICAgICAgZGlyZWN0aXZlcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBkaXI7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnRWTm9kZShub2RlKSB7XHJcbiAgICBjb25zdCB7IGNoaWxkcmVuIH0gPSBub2RlO1xyXG4gICAgY29uc3QgdGFnID0gSlNPTi5zdHJpbmdpZnkobm9kZS50YWcpOyAgLy8gdGFnIOi9rOaIkOWtl+espuS4slxyXG5cclxuICAgIGNvbnN0IHByb3BBcnIgPSBjcmVhdGVQcm9wQXJyKG5vZGUpO1xyXG5cclxuICAgIGNvbnN0IHByb3BTdHIgPSBwcm9wQXJyLmxlbmd0aCA/IGB7ICR7cHJvcEFyci5qb2luKCcsICcpfSB9YCA6ICdudWxsJztcclxuXHJcbiAgICBpZighY2hpbGRyZW4ubGVuZ3RoKSB7XHJcbiAgICAgICAgaWYocHJvcFN0ciA9PT0gJ251bGwnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBgaCgke3RhZ30pYDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGBoKCR7dGFnfSwgJHtwcm9wU3RyfSlgO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBjaGlsZHJlblN0ciA9IHRyYXZlcnNlQ2hpbGRyZW4obm9kZSk7XHJcblxyXG4gICAgcmV0dXJuIGBoKCR7dGFnfSwgJHtwcm9wU3RyfSwgJHtjaGlsZHJlblN0cn0pYDtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlUHJvcEFycihub2RlKSB7XHJcbiAgICBjb25zdCB7IHByb3BzLCBkaXJlY3RpdmVzIH0gPSBub2RlO1xyXG4gICAgcmV0dXJuIFsuLi5wcm9wcy5tYXAoKHByb3ApID0+IGAke3Byb3AubmFtZX06ICR7Y3JlYXRlVGV4dChwcm9wLnZhbHVlKX1gKSwuLi5kaXJlY3RpdmVzLm1hcCgoZGlyKSA9PiB7XHJcbiAgICAgICAgc3dpdGNoIChkaXIubmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlICdiaW5kJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBgJHtkaXIuYXJnLmNvbnRlbnR9OiAke2NyZWF0ZVRleHQoZGlyLmV4cCl9YDtcclxuICAgICAgICAgICAgY2FzZSAnb24nOiBcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50TmFtZSA9IGBvbiR7Y2FwaXRhbGl6ZShkaXIuYXJnLmNvbnRlbnQpfWA7XHJcbiAgICAgICAgICAgICAgICBsZXQgZXhwID0gZGlyLmV4cC5jb250ZW50O1xyXG4gICAgICAgICAgICAgICAgLy8g5aSE55CG57uR5a6a55qE5Ye95pWw5aaC5p6c5pyJ5Y+C5pWw55qE6K+d77yM6KaB5YyF6KOF5oiQICgkZXZlbnQpID0+IGZvbyhiYXIsIGkpICDlm6DkuLrmnInpu5jorqTlj4LmlbAgJGV2ZW50XHJcbiAgICAgICAgICAgICAgICAvLyDpgJrov4fmraPliJnliKTmlq3mmK/lkKbmnInmi6zlj7fku6Xlj4rmi6zlj7flhoXmmK/lkKbmnInlhoXlrrlcclxuICAgICAgICAgICAgICAgIGlmKC9cXChbXildKj9cXCkkLy50ZXN0KGV4cCkgJiYgIWV4cC5pbmNsdWRlcygnPT4nKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cCA9IGAkZXZlbnQgPT4gKCR7ZXhwfSlgO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGAke2V2ZW50TmFtZX06ICR7ZXhwfWA7XHJcbiAgICAgICAgICAgIGNhc2UgJ2h0bWwnOiBcclxuICAgICAgICAgICAgICAgIHJldHVybiBgaW5uZXJIdG1sOiAke2NyZWF0ZVRleHQoZGlyLmV4cCl9YDtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBgJHtkaXIubmFtZX06ICR7Y3JlYXRlVGV4dChkaXIuZXhwKX1gO1xyXG4gICAgICAgIH1cclxuICAgIH0pXTtcclxufVxyXG5cclxuZnVuY3Rpb24gdHJhdmVyc2VDaGlsZHJlbihub2RlKSB7XHJcbiAgICBjb25zdCB7IGNoaWxkcmVuIH0gPSBub2RlO1xyXG5cclxuICAgIGlmKGNoaWxkcmVuLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5bMF07XHJcbiAgICAgICAgaWYoY2hpbGQudHlwZSA9PT0gTm9kZVR5cGVzLlRFWFQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZVRleHQoY2hpbGQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihjaGlsZC50eXBlID09PSBOb2RlVHlwZXMuSU5URVJQT0xBVElPTikge1xyXG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlVGV4dChjaGlsZC5jb250ZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVzdWx0cyA9IFtdO1xyXG4gICAgZm9yKGxldCBpID0gMDtpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldO1xyXG4gICAgICAgIHJlc3VsdHMucHVzaCh0cmF2ZXJzZU5vZGUoY2hpbGQpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYFske3Jlc3VsdHMuam9pbignLCAnKX1dYFxyXG59IiwiaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiLi9wYXJzZVwiO1xyXG5pbXBvcnQgeyBnZW5lcmF0ZSB9IGZyb20gXCIuL2NvZGVnZW5cIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlKHRlbXBsYXRlKSB7XHJcbiAgICBjb25zdCBhc3QgPSBwYXJzZSh0ZW1wbGF0ZSk7XHJcbiAgICByZXR1cm4gZ2VuZXJhdGUoYXN0KTtcclxufSIsIi8vIOaemuS4vuWIpOaWreaYr+WQpuS4uuWOn+Wni+agh+etvuS7peWPiuaYr+WQpuS4uuiHqumXreWQiOagh+etvlxyXG5jb25zdCBIVE1MX1RBR1MgPVxyXG4gICdodG1sLGJvZHksYmFzZSxoZWFkLGxpbmssbWV0YSxzdHlsZSx0aXRsZSxhZGRyZXNzLGFydGljbGUsYXNpZGUsZm9vdGVyLCcgK1xyXG4gICdoZWFkZXIsaDEsaDIsaDMsaDQsaDUsaDYsaGdyb3VwLG5hdixzZWN0aW9uLGRpdixkZCxkbCxkdCxmaWdjYXB0aW9uLCcgK1xyXG4gICdmaWd1cmUscGljdHVyZSxocixpbWcsbGksbWFpbixvbCxwLHByZSx1bCxhLGIsYWJicixiZGksYmRvLGJyLGNpdGUsY29kZSwnICtcclxuICAnZGF0YSxkZm4sZW0saSxrYmQsbWFyayxxLHJwLHJ0LHJ0YyxydWJ5LHMsc2FtcCxzbWFsbCxzcGFuLHN0cm9uZyxzdWIsc3VwLCcgK1xyXG4gICd0aW1lLHUsdmFyLHdicixhcmVhLGF1ZGlvLG1hcCx0cmFjayx2aWRlbyxlbWJlZCxvYmplY3QscGFyYW0sc291cmNlLCcgK1xyXG4gICdjYW52YXMsc2NyaXB0LG5vc2NyaXB0LGRlbCxpbnMsY2FwdGlvbixjb2wsY29sZ3JvdXAsdGFibGUsdGhlYWQsdGJvZHksdGQsJyArXHJcbiAgJ3RoLHRyLGJ1dHRvbixkYXRhbGlzdCxmaWVsZHNldCxmb3JtLGlucHV0LGxhYmVsLGxlZ2VuZCxtZXRlcixvcHRncm91cCwnICtcclxuICAnb3B0aW9uLG91dHB1dCxwcm9ncmVzcyxzZWxlY3QsdGV4dGFyZWEsZGV0YWlscyxkaWFsb2csbWVudSwnICtcclxuICAnc3VtbWFyeSx0ZW1wbGF0ZSxibG9ja3F1b3RlLGlmcmFtZSx0Zm9vdCc7XHJcblxyXG5jb25zdCBWT0lEX1RBR1MgPVxyXG4gICdhcmVhLGJhc2UsYnIsY29sLGVtYmVkLGhyLGltZyxpbnB1dCxsaW5rLG1ldGEscGFyYW0sc291cmNlLHRyYWNrLHdicic7XHJcblxyXG5mdW5jdGlvbiBtYWtlTWFwKHN0cikge1xyXG4gIGNvbnN0IG1hcCA9IHN0clxyXG4gICAgLnNwbGl0KCcsJylcclxuICAgIC5yZWR1Y2UoKG1hcCwgaXRlbSkgPT4gKChtYXBbaXRlbV0gPSB0cnVlKSwgbWFwKSwgT2JqZWN0LmNyZWF0ZShudWxsKSk7XHJcbiAgcmV0dXJuICh2YWwpID0+ICEhbWFwW3ZhbF07XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBpc1ZvaWRUYWcgPSBtYWtlTWFwKFZPSURfVEFHUyk7XHJcbmV4cG9ydCBjb25zdCBpc05hdGl2ZVRhZyA9IG1ha2VNYXAoSFRNTF9UQUdTKTtcclxuXHJcbmV4cG9ydCB7IHBhcnNlIH0gZnJvbSAnLi9wYXJzZSc7XHJcbmV4cG9ydCB7IE5vZGVUeXBlcyB9IGZyb20gJy4vYXN0JztcclxuZXhwb3J0IHsgY29tcGlsZSB9IGZyb20gJy4vY29tcGlsZSc7IiwiaW1wb3J0IHsgY2FtZWxpemUgfSBmcm9tIFwiLi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgTm9kZVR5cGVzLCBFbGVtZW50VHlwZXMsIGNyZWF0ZVJvb3QgfSBmcm9tIFwiLi9hc3RcIjtcclxuaW1wb3J0IHsgaXNWb2lkVGFnLCBpc05hdGl2ZVRhZyB9IGZyb20gXCIuL2luZGV4XCI7XHJcblxyXG4vLyDop6PmnpDov4fnqIvkuK3nmoTopoHngrnlsLHmmK/vvJrovrnop6PmnpDovrnliKDpmaTvvIznlKggYWR2YW5jZUJ5KCkg5omA5Lul6KaB6Kej5p6Q55qE5LiA55u06YO95piv5LuO5LiL5qCHIDAg5byA5aeL55qEXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShjb250ZW50KSB7XHJcbiAgICBjb25zdCBjb250ZXh0ID0gY3JlYXRlUGFyc2VyQ29udGV4dChjb250ZW50KTsgICAvLyDphY3nva7kuIrkuIvmlodcclxuICAgIGNvbnN0IGNoaWxkcmVuID0gcGFyc2VDaGlsZHJlbihjb250ZXh0KTtcclxuICAgIHJldHVybiBjcmVhdGVSb290KGNoaWxkcmVuKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlUGFyc2VyQ29udGV4dChjb250ZW50KSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgZGVsaW1pdGVyczogWyd7eycsJ319J10sICAgICAgIC8vIOaPkuWAvOeahOaooeadv+aYr+WPr+mFjee9rueahFxyXG4gICAgICAgICAgICBpc1ZvaWRUYWcsICAgICAgLy8g5Yik5pat6Ieq6Zet5ZCI5qCH562+XHJcbiAgICAgICAgICAgIGlzTmF0aXZlVGFnICAgIC8vIOWIpOaWreWOn+Wni+agh+etvlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc291cmNlOiBjb250ZW50ICAgICAvLyDmqKHmnb/lrZfnrKbkuLJcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VDaGlsZHJlbihjb250ZXh0KSB7XHJcbiAgICBjb25zdCBub2RlcyA9IFtdOyAgICAvLyDlrZjmlL7op6PmnpDlh7rmnaXnmoToioLngrlcclxuXHJcbiAgICB3aGlsZSghaXNFbmQoY29udGV4dCkpIHtcclxuICAgICAgICBjb25zdCBzID0gY29udGV4dC5zb3VyY2U7XHJcbiAgICAgICAgbGV0IG5vZGU7XHJcbiAgICAgICAgaWYocy5zdGFydHNXaXRoKGNvbnRleHQub3B0aW9ucy5kZWxpbWl0ZXJzWzBdKSkge1xyXG4gICAgICAgICAgICAvLyDop6PmnpDmj5LlgLzoioLngrlcclxuICAgICAgICAgICAgbm9kZSA9IHBhcnNlSW50ZXJwb2xhdGlvbihjb250ZXh0KTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNbMF0gPT09ICc8Jykge1xyXG4gICAgICAgICAgICAvLyDop6PmnpDlhYPntKDoioLngrlcclxuICAgICAgICAgICAgbm9kZSA9IHBhcnNlRWxlbWVudChjb250ZXh0KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyDop6PmnpDmlofmnKzoioLngrlcclxuICAgICAgICAgICAgbm9kZSA9IHBhcnNlVGV4dChjb250ZXh0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbm9kZXMucHVzaChub2RlKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyDkvJjljJbmnInnqbrmoLznmoTml7blgJnvvIzmmK/opoHljovnvKnmiJAx5Liq6L+Y5piv6KaB5Yig6Zmk77yMIOS8mOWMliB3aGl0ZVNwYWNlc1xyXG4gICAgbGV0IHJlbW92ZWRXaGl0ZVNwYWNlcyA9IGZhbHNlO1xyXG5cclxuICAgIGZvcihsZXQgaSA9IDA7aSA8IG5vZGVzLmxlbmd0aDtpKyspIHtcclxuICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XHJcbiAgICAgICAgaWYobm9kZS50eXBlID09PSBOb2RlVHlwZXMuVEVYVCkge1xyXG4gICAgICAgICAgICAvLyDljLrliIbmlofmnKzoioLngrnmmK/lkKblhajmmK/nqbrnmb1cclxuICAgICAgICAgICAgaWYoL1teXFx0XFxyXFxmXFxuIF0vLnRlc3Qobm9kZS5jb250ZW50KSkge1xyXG4gICAgICAgICAgICAgICAgLy8g5paH5pys5Lit5pyJ5LiA5Lqb5a2X56ym77yM5oqK56m65qC85Y6L57yp5oiQ5LiA5LiqICDkvovlpoLvvJogYSAgICAgICAgYiB2ICBcclxuICAgICAgICAgICAgICAgIG5vZGUuY29udGVudCA9IG5vZGUuY29udGVudC5yZXBsYWNlKC9bXFx0XFxyXFxmXFxuIF0rL2csICcgJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyDmlofmnKzoioLngrnlhajmmK/nqbrnmb1cclxuICAgICAgICAgICAgICAgIGNvbnN0IHByZXYgPSBub2Rlc1tpIC0gMV07XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gbm9kZXNbaSArIDFdO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIOWQjOaXtuimgSDmu6HotrPlhajmmK/nqbrnmb3oioLngrnkuJTliY3lkI7oioLngrnpg73mmK8g5qCH562+5YWD57Sg6IqC54K5IOiAjOS4lOacieaNouihjOespuaJjeiDveaKiuivpeiKgueCueWIoOmZpCDor7TmmI7mraTml7bnmoTmg4XlhrXmmK8gXHJcbiAgICAgICAgICAgICAgICAvLyA8c3Bhbj5hPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgLy8gPHNwYW4+Yjwvc3Bhbj5cclxuICAgICAgICAgICAgICAgIGlmKCFwcmV2IHx8ICFuZXh0IHx8IChwcmV2LnR5cGUgPT09IE5vZGVUeXBlcy5FTEVNRU5UICYmIG5leHQudHlwZSA9PT0gTm9kZVR5cGVzLkVMRU1FTlQgJiYgL1tcXHJcXG5dLy50ZXN0KG5vZGUuY29udGVudCkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZFdoaXRlU3BhY2VzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBub2Rlc1tpXSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOayoeacieaNouihjOespu+8jOmCo+WwseWOi+e8qeepuueZveiKgueCueS4uuS4gOS4quepuuagvCAg5L6L5aaC5oOF5Ya15Li677yaIDxzcGFuPmE8L3NwYW4+ICAgICA8c3Bhbj5iPC9zcGFuPiAg5Lit6Ze06L+Y5piv5Lya5L+d55WZ5LiA5Liq56m65qC855qEXHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5jb250ZW50ID0gJyAnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIOaciemcgOimgeWIoOmZpOeahOiKgueCueaXtuaJjeWIoOmZpO+8jOayoeacieWwseebtOaOpei/lOWbnlxyXG4gICAgcmV0dXJuIHJlbW92ZWRXaGl0ZVNwYWNlcyA/IG5vZGVzLmZpbHRlcihCb29sZWFuKSA6IG5vZGVzO1xyXG59XHJcblxyXG4vLyDop6PmnpDmj5LlgLwgIHt7IG5hbWUgfX1cclxuZnVuY3Rpb24gcGFyc2VJbnRlcnBvbGF0aW9uKGNvbnRleHQpIHtcclxuICAgIGNvbnN0IFtvcGVuLCBjbG9zZV0gPSBjb250ZXh0Lm9wdGlvbnMuZGVsaW1pdGVyczsgICAvLyDlj5blh7oge3sg5ZKMIH19XHJcblxyXG4gICAgYWR2YW5jZUJ5KGNvbnRleHQsIG9wZW4ubGVuZ3RoKTsgIC8vIOWOu+aOiSB7e1xyXG4gICAgXHJcbiAgICBjb25zdCBjbG9zZUluZGV4ID0gY29udGV4dC5zb3VyY2UuaW5kZXhPZihjbG9zZSk7XHJcblxyXG4gICAgY29uc3QgY29udGVudCA9IHBhcnNlVGV4dERhdGEoY29udGV4dCwgY2xvc2VJbmRleCkudHJpbSgpOyAgLy8g5b6X5Yiw5o+S5YC86KGo6L6+5byP5Lit55qE5paH5pys5L+h5oGv77yM5bm25ZyoIGNvbnRleHQuc291cmNlIOS4reWOu+aOie+8jOWQjOaXtuWvuei/lOWbnueahCBjb250ZW50IOmmluWwvuWOu+mZpOepuuagvFxyXG5cclxuICAgIGFkdmFuY2VCeShjb250ZXh0LCBjbG9zZS5sZW5ndGgpOyAgIC8vIOWOu+aOiSB9fVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdHlwZTogTm9kZVR5cGVzLklOVEVSUE9MQVRJT04sXHJcbiAgICAgICAgY29udGVudDoge1xyXG4gICAgICAgICAgICB0eXBlOiBOb2RlVHlwZXMuU0lNUExFX0VYUFJFU1NJT04sXHJcbiAgICAgICAgICAgIGNvbnRlbnQsXHJcbiAgICAgICAgICAgIGlzU3RhdGljOiBmYWxzZSwgICAgICAgICAgLy8g5LiN5LiA5a6a5piv6Z2Z5oCB55qE77yM5Zug5Li65o+S5YC85Lit6Ze05Lmf5Y+v5Lul5piv6KGo6L6+5byPIHt7IGEgKyBiIH19XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vLyDop6PmnpDmoIfnrb4gPGRpdiBpZD0nYWFhJz5oZWxsbyB7eyBuYW1lIH19PC9kaXY+XHJcbmZ1bmN0aW9uIHBhcnNlRWxlbWVudChjb250ZXh0KSB7XHJcbiAgICAvLyBwYXJzZVRhZyAoc3RhcnQpXHJcbiAgICBjb25zdCBlbGVtZW50ID0gcGFyc2VUYWcoY29udGV4dCk7XHJcbiAgICBpZihlbGVtZW50LmlzU2VsZkNsb3NpbmcgfHwgY29udGV4dC5vcHRpb25zLmlzVm9pZFRhZyhlbGVtZW50LnRhZykpIHsgICAvLyDlpoLmnpzmmK/oh6rpl63lkIjmoIfnrb7lsLHlj6/ku6Xnm7TmjqXov5Tlm57kuobvvIzkuIvpnaLnmoTpg6jliIbkuI3nlKjop6PmnpDkuoZcclxuICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBwYXJzZUNoaWxkcmVuIOino+aekOagh+etvuS4reeahOWGheWuuVxyXG4gICAgZWxlbWVudC5jaGlsZHJlbiA9IHBhcnNlQ2hpbGRyZW4oY29udGV4dCk7XHJcbiAgICBcclxuICAgIC8vIHBhcnNlVGFnIChlbmQpICAg55uu55qE5piv5Li65LqG5oqKIDwvZGl2PiDliKDmjolcclxuICAgIHBhcnNlVGFnKGNvbnRleHQpO1xyXG5cclxuICAgIHJldHVybiBlbGVtZW50O1xyXG59XHJcblxyXG4vLyDlsIHoo4XkuIDkuIvop6PmnpDmoIfnrb4gPGRpdiBpZD0nYWFhJz5oZWxsbyB7eyBuYW1lIH19PC9kaXY+XHJcbmZ1bmN0aW9uIHBhcnNlVGFnKGNvbnRleHQpIHtcclxuICAgIGNvbnN0IG1hdGNoID0gL148XFwvPyhbYS16XVteXFx0XFxyXFxuXFxmIC8+XSopL2kuZXhlYyhjb250ZXh0LnNvdXJjZSk7XHJcbiAgICBjb25zdCB0YWcgPSBtYXRjaFsxXTsgIC8vIOWIhue7hOeahOesrOS6jOS4qu+8jOWFtuWunuS5n+WwseaYr+WMuemFjeagh+etvuWQjeeahOWcsOaWuSAgZGl2XHJcblxyXG4gICAgYWR2YW5jZUJ5KGNvbnRleHQsIG1hdGNoWzBdLmxlbmd0aCk7ICAgIC8vIOWIoOaOieWMuemFjeWIsOeahOagh+etvlxyXG4gICAgYWR2YW5jZVNwYWNlcyhjb250ZXh0KTsgICAgLy8g5Yig6Zmk5Ymp5LiL55qE56m65qC8XHJcblxyXG4gICAgY29uc3QgeyBwcm9wcywgZGlyZWN0aXZlcyB9ID0gcGFyc2VBdHRyaWJ1dGVzKGNvbnRleHQpO1xyXG5cclxuICAgIC8vIOWJjemdouW3sue7j+WIoOmZpOS6huagh+etvuWktOmDqOS7peWPiuWxnuaAp+mDqOWIhlxyXG4gICAgY29uc3QgaXNTZWxmQ2xvc2luZyA9IGNvbnRleHQuc291cmNlLnN0YXJ0c1dpdGgoJy8+Jyk7XHJcbiAgICBhZHZhbmNlQnkoY29udGV4dCwgaXNTZWxmQ2xvc2luZyA/IDIgOiAxKTtcclxuXHJcbiAgICBjb25zdCB0YWdUeXBlID0gaXNDb21wb25lbnQodGFnLCBjb250ZXh0KSA/IEVsZW1lbnRUeXBlcy5DT01QT05FTlQgOiBFbGVtZW50VHlwZXMuRUxFTUVOVDtcclxuXHJcbiAgICByZXR1cm4gIHtcclxuICAgICAgICB0eXBlOiBOb2RlVHlwZXMuRUxFTUVOVCxcclxuICAgICAgICB0YWcsICAgIC8vIOagh+etvuWQjVxyXG4gICAgICAgIHRhZ1R5cGUsICAgIC8vIOaYr+e7hOS7tui/mOaYr+WOn+Wni+agh+etvlxyXG4gICAgICAgIHByb3BzLCAgICAgLy8g5bGe5oCn6IqC54K55pWw57uEXHJcbiAgICAgICAgZGlyZWN0aXZlcywgICAgLy8g5oyH5Luk6IqC54K55pWw57uEXHJcbiAgICAgICAgaXNTZWxmQ2xvc2luZywgICAvLyDmmK/lkKboh6rpl63lkIjmoIfnrb5cclxuICAgICAgICBjaGlsZHJlbjogW10sXHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzQ29tcG9uZW50KHRhZywgY29udGV4dCkge1xyXG4gICAgcmV0dXJuICFjb250ZXh0Lm9wdGlvbnMuaXNOYXRpdmVUYWcodGFnKTtcclxufVxyXG5cclxuLy8g5bCB6KOF5LiA5LiL6Kej5p6Q5qCH562+5Lit55qEIOWxnuaApyBpZD0nYWFhJyDlkowg5oyH5LukIHYtaWY9J29rJ1xyXG4vLyDop6PmnpDmiYDmnInlsZ7mgKfvvIzmlL7lnKjmlbDnu4Tph4zov5Tlm55cclxuZnVuY3Rpb24gcGFyc2VBdHRyaWJ1dGVzKGNvbnRleHQpIHtcclxuICAgIGNvbnN0IHByb3BzID0gW107XHJcbiAgICBjb25zdCBkaXJlY3RpdmVzID0gW107XHJcblxyXG4gICAgd2hpbGUoY29udGV4dC5zb3VyY2UubGVuZ3RoICYmICFjb250ZXh0LnNvdXJjZS5zdGFydHNXaXRoKCc+JykgJiYgIWNvbnRleHQuc291cmNlLnN0YXJ0c1dpdGgoJy8+JykpIHtcclxuICAgICAgICBsZXQgYXR0ciA9IHBhcnNlQXR0cmlidXRlKGNvbnRleHQpOyAgICAgICAgLy8g6Kej5p6Q5Y2V5Liq5bGe5oCnXHJcbiAgICAgICAgaWYoYXR0ci50eXBlID09PSBOb2RlVHlwZXMuQVRUUklCVVRFKSB7XHJcbiAgICAgICAgICAgIHByb3BzLnB1c2goYXR0cik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZGlyZWN0aXZlcy5wdXNoKGF0dHIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB7IHByb3BzLCBkaXJlY3RpdmVzIH07XHJcbn1cclxuXHJcbi8vIOino+aekOWNleS4quWxnuaAp+iKgueCuVxyXG5mdW5jdGlvbiBwYXJzZUF0dHJpYnV0ZShjb250ZXh0KSB7XHJcbiAgICBjb25zdCBtYXRjaCA9IC9eW15cXHRcXHJcXG5cXGYgLz5dW15cXHRcXHJcXG5cXGYgLz49XSovLmV4ZWMoY29udGV4dC5zb3VyY2UpO1xyXG4gICAgY29uc3QgbmFtZSA9IG1hdGNoWzBdOyAgICAgICAgLy8g5Y+W5Ye65bGe5oCn5ZCN77yM5L6L5aaC77yaIGlkICBjbGFzcyAuLi5cclxuXHJcbiAgICBhZHZhbmNlQnkoY29udGV4dCwgbmFtZS5sZW5ndGgpO1xyXG4gICAgYWR2YW5jZVNwYWNlcyhjb250ZXh0KTsgICAgICAgICAgLy8g5Yig5o6J5bGe5oCn5ZCN5Lul5Y+K5YmN5ZCO55qE56m65qC8XHJcblxyXG4gICAgbGV0IHZhbHVlOyAgLy8g6Kej5p6Q562J5LqO5Y+35ZCO6Z2i55qE5bGe5oCn5YC8XHJcbiAgICBpZihjb250ZXh0LnNvdXJjZVswXSA9PSAnPScpIHsgICAgICAvLyDlvZPnrKzkuIDkuKrkuLogPSDlj7fml7bvvIzop6PmnpDlsZ7mgKfnmoTlgLzvvIzlm6DkuLrmnInlj6/og73lj6rmmK/lsZ7mgKflkI3ogIzlt7Ig5L6L5aaC77yaY2hlY2tlZFxyXG4gICAgICAgIGFkdmFuY2VCeShjb250ZXh0LDEpO1xyXG4gICAgICAgIGFkdmFuY2VTcGFjZXMoY29udGV4dCk7XHJcbiAgICAgICAgdmFsdWUgPSBwYXJzZUF0dHJpYnV0ZVZhbHVlKGNvbnRleHQpO1xyXG4gICAgICAgIGFkdmFuY2VTcGFjZXMoY29udGV4dCk7ICAgICAvLyDojrflj5blrozlgLzlkI7vvIzlkI7pnaLkuZ/mnInnqbrmoLzvvIzkuZ/opoHliKDmjolcclxuICAgIH1cclxuXHJcbiAgICAvLyDlpoLmnpzmmK/mjIfku6ToioLngrlcclxuICAgIGlmKC9eKDp8QHx2LSkvLnRlc3QobmFtZSkpIHtcclxuICAgICAgICBsZXQgZGlyTmFtZSwgYXJnQ29udGVudDtcclxuXHJcbiAgICAgICAgaWYobmFtZVswXSA9PT0gJzonKSB7XHJcbiAgICAgICAgICAgIGRpck5hbWUgPSAnYmluZCc7XHJcbiAgICAgICAgICAgIGFyZ0NvbnRlbnQgPSBuYW1lLnNsaWNlKDEpOyAgIC8vIOWOu+mZpOaOiSA6IOS5i+WQjueahOmDveaYr+aMh+S7pOWQjVxyXG4gICAgICAgIH0gZWxzZSBpZiAobmFtZVswXSA9PT0gJ0AnKSB7XHJcbiAgICAgICAgICAgIGRpck5hbWUgPSAnb24nO1xyXG4gICAgICAgICAgICBhcmdDb250ZW50ID0gbmFtZS5zbGljZSgxKTtcclxuICAgICAgICB9IGVsc2UgaWYgKG5hbWUuc3RhcnRzV2l0aCgndi0nKSkge1xyXG4gICAgICAgICAgICBbZGlyTmFtZSwgYXJnQ29udGVudF0gPSBuYW1lLnNsaWNlKDIpLnNwbGl0KCc6Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0eXBlOiBOb2RlVHlwZXMuRElSRUNUSVZFLFxyXG4gICAgICAgICAgICBuYW1lOiBkaXJOYW1lLFxyXG4gICAgICAgICAgICBleHA6IHZhbHVlICYmIHsgICAgLy8g5oyH5Luk55qE5YaF5a65ID0g5Y+35ZCO6Z2i55qE5YaF5a65XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBOb2RlVHlwZXMuU0lNUExFX0VYUFJFU1NJT04sXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiB2YWx1ZS5jb250ZW50LFxyXG4gICAgICAgICAgICAgICAgaXNTdGF0aWM6IGZhbHNlLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBhcmc6IGFyZ0NvbnRlbnQgJiYgeyAgICAgLy8g5oyH5Luk5ZCNICBjbGljayBtb3VzZW1vdmUg5oiW6ICF6Ieq5a6a5LmJ55qEIDpteUNsYXNzIOS4reeahCBteUNsYXNzXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBOb2RlVHlwZXMuU0lNUExFX0VYUFJFU1NJT04sXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiBjYW1lbGl6ZShhcmdDb250ZW50KSwgICAvLyDmiormjIfku6TlkI3ovazmjaLkuLrpqbzls7DlvaLlvI9cclxuICAgICAgICAgICAgICAgIGlzU3RhdGljOiB0cnVlLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIOWxnuaAp+iKgueCuVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0eXBlOiBOb2RlVHlwZXMuQVRUUklCVVRFLFxyXG4gICAgICAgIG5hbWUsXHJcbiAgICAgICAgdmFsdWU6IHZhbHVlICYmIHtcclxuICAgICAgICAgICAgdHlwZTogTm9kZVR5cGVzLlRFWFQsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IHZhbHVlLmNvbnRlbnRcclxuICAgICAgICB9XHJcbiAgICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZUF0dHJpYnV0ZVZhbHVlKGNvbnRleHQpIHtcclxuICAgIGNvbnN0IHF1b3RlID0gY29udGV4dC5zb3VyY2VbMF07ICAgIC8vIOacieWPr+iDveaYr+WNleW8leWPt+S5n+WPr+iDveaYr+WPjOW8leWPt1xyXG4gICAgYWR2YW5jZUJ5KGNvbnRleHQsIDEpO1xyXG5cclxuICAgIGNvbnN0IGVuZEluZGV4ID0gY29udGV4dC5zb3VyY2UuaW5kZXhPZihxdW90ZSk7XHJcblxyXG4gICAgY29uc3QgY29udGVudCA9IHBhcnNlVGV4dERhdGEoY29udGV4dCwgZW5kSW5kZXgpOyAgLy8g5Y+W5Ye65bm25Yig6Zmk5bGe5oCn5YC8XHJcblxyXG4gICAgYWR2YW5jZUJ5KGNvbnRleHQsIDEpOyAgIC8vIOacgOWQjuS4gOS4quW8leWPt+WIoOmZpFxyXG5cclxuICAgIHJldHVybiB7IGNvbnRlbnQgfTtcclxufVxyXG5cclxuLy8g57y66Zm377ya5LiN5pSv5oyB5paH5pys6IqC54K55Lit5bimIDwg5Y+377yM5L6L5aaC77yaIGEgPCBiXHJcbmZ1bmN0aW9uIHBhcnNlVGV4dChjb250ZXh0KSB7XHJcbiAgICAvLyDmnInkuInnp43mg4XlhrXmmK/nu5PmnZ/moIflv5fvvIwxLiDpgYfliLAgPCDor7TmmI7pgYfliLDpl63lkIjmoIfnrb7kuoYgIDIu6YGH5YiwIHt7IOivtOaYjuWQjumdouaYr+aPkuWAvOiKgueCueS6hiAgXHJcbiAgICAvLyAzLiDlhoXlrrnnu5PmnZ/kuobvvIzlsLHmmK9jb250ZXh0LnNvdXJjZS5sZW5ndGggIOeci+WTquenjeaDheWGteacgOWFiOWHuueOsO+8jOaKiiBlbmRJbmRleCDorr7nva7kuLrmnIDlhYjlh7rnjrDnmoTkvY3nva4gXHJcbiAgICBjb25zdCBlbmRUb2tlbnMgPSBbJzwnLCBjb250ZXh0Lm9wdGlvbnMuZGVsaW1pdGVyc1swXV07XHJcblxyXG4gICAgbGV0IGVuZEluZGV4ID0gY29udGV4dC5zb3VyY2UubGVuZ3RoO1xyXG5cclxuICAgIGZvcihsZXQgaSA9IDA7aSA8IGVuZFRva2Vucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGxldCBpbmRleCA9IGNvbnRleHQuc291cmNlLmluZGV4T2YoZW5kVG9rZW5zW2ldLDEpO1xyXG4gICAgICAgIGlmKGluZGV4IDwgZW5kSW5kZXggJiYgaW5kZXggIT09IC0xKSB7XHJcbiAgICAgICAgICAgIGVuZEluZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbnRlbnQgPSBwYXJzZVRleHREYXRhKGNvbnRleHQsIGVuZEluZGV4KTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHR5cGU6IE5vZGVUeXBlcy5URVhULFxyXG4gICAgICAgIGNvbnRlbnQsXHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIOWwgeijheS4gOS4i+aIquWPluaWh+acrOWGheWuueeahOWHveaVsFxyXG5mdW5jdGlvbiBwYXJzZVRleHREYXRhKGNvbnRleHQsIGxlbmd0aCkge1xyXG4gICAgY29uc3QgdGV4dCA9IGNvbnRleHQuc291cmNlLnNsaWNlKDAsIGxlbmd0aCk7ICAgIC8vIOaIquWPluS4remXtOeahOWtl+espuW+l+WIsOaWh+acrOWGheWuuVxyXG4gICAgYWR2YW5jZUJ5KGNvbnRleHQsIGxlbmd0aCk7ICAgLy8g5oqK6Kej5p6Q5Ye65p2l55qE6YOo5YiG6KOB5Ymq5o6JXHJcbiAgICByZXR1cm4gdGV4dDtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNFbmQoY29udGV4dCkge1xyXG4gICAgY29uc3QgcyA9IGNvbnRleHQuc291cmNlO1xyXG4gICAgcmV0dXJuIHMuc3RhcnRzV2l0aCgnPC8nKSB8fCAhczsgICAvLyDlvZPpgYfliLDmoIfnrb7nmoTpl63lkIjnrKblj7cgPC8g5Lul5Y+KIHMg5Li656m65pe26K+05piO6Kej5p6Q6KaB57uT5p2f5LqGXHJcbn1cclxuXHJcbi8vIOS7juWktOmDqOW8gOWniyzlm7rlrprplb/luqblvIDlp4voo4HliapcclxuZnVuY3Rpb24gYWR2YW5jZUJ5KGNvbnRleHQsIG51bWJlck9mQ2hhcmFjdGVycykge1xyXG4gICAgY29udGV4dC5zb3VyY2UgPSBjb250ZXh0LnNvdXJjZS5zbGljZShudW1iZXJPZkNoYXJhY3RlcnMpO1xyXG59XHJcblxyXG4vLyDmiornqbrmoLzliKDmjolcclxuZnVuY3Rpb24gYWR2YW5jZVNwYWNlcyhjb250ZXh0KSB7XHJcbiAgICBjb25zdCBtYXRjaCA9IC9eW1xcdFxcclxcblxcZiBdKy8uZXhlYyhjb250ZXh0LnNvdXJjZSk7XHJcbiAgICBpZihtYXRjaCkge1xyXG4gICAgICAgIGFkdmFuY2VCeShjb250ZXh0LCBtYXRjaFswXS5sZW5ndGgpOyAgLy8g5oqK56m65qC85Yig5o6JXHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBpc0Z1bmN0aW9uIH0gZnJvbSBcIi4uL3V0aWxzXCI7XHJcbmltcG9ydCB7IGVmZmVjdCwgdHJhY2ssIHRyaWdnZXIgfSBmcm9tIFwiLi9lZmZlY3RcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlZChnZXR0ZXJPck9wdGlvbikge1xyXG4gICAgbGV0IGdldHRlciwgc2V0dGVyO1xyXG5cclxuICAgIGlmKGlzRnVuY3Rpb24oZ2V0dGVyT3JPcHRpb24pKSB7XHJcbiAgICAgICAgZ2V0dGVyID0gZ2V0dGVyT3JPcHRpb247XHJcbiAgICAgICAgc2V0dGVyID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ2NvbXB1dGVkIGlzIHJlYWRvbmx5Jyk7XHJcbiAgICAgICAgfTtcclxuICAgIH1lbHNlIHtcclxuICAgICAgICBnZXR0ZXIgPSBnZXR0ZXJPck9wdGlvbi5nZXQ7XHJcbiAgICAgICAgc2V0dGVyID0gZ2V0dGVyT3JPcHRpb24uc2V0O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgQ29tcHV0ZWRJbXBsKGdldHRlciwgc2V0dGVyKTtcclxufVxyXG5cclxuY2xhc3MgQ29tcHV0ZWRJbXBsIHtcclxuICAgIGNvbnN0cnVjdG9yKGdldHRlciwgc2V0dGVyKSB7XHJcbiAgICAgICAgdGhpcy5fc2V0dGVyID0gc2V0dGVyO1xyXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIHRoaXMuX2RpcnR5ID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmVmZmVjdCA9IGVmZmVjdChnZXR0ZXIsIHtcclxuICAgICAgICAgICAgbGF6eTogdHJ1ZSxcclxuICAgICAgICAgICAgLy8g6LCD5bqm5Ye95pWwXHJcbiAgICAgICAgICAgIHNjaGVkdWxlcjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZGlydHkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdHJpZ2dlcih0aGlzLCAndmFsdWUnKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIGdldCB2YWx1ZSgpIHtcclxuICAgICAgICBpZih0aGlzLl9kaXJ0eSkge1xyXG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IHRoaXMuZWZmZWN0KCk7IC8vIGVmZmVjdOi/lOWbnuWAvCDmmK/miafooYwgZ2V0dGVyIOS5i+WQjueahOi/lOWbnuWAvCBcclxuICAgICAgICAgICAgdGhpcy5fZGlydHkgPSBmYWxzZTtcclxuICAgICAgICAgICAgdHJhY2sodGhpcywgJ3ZhbHVlJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IHZhbHVlKG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5fc2V0dGVyKG5ld1ZhbHVlKTtcclxuICAgIH1cclxufSIsIi8vIOeUqOagiOWtmOWCqOWJr+S9nOeUqOWHveaVsO+8jOmBv+WFjeW1jOWllyBlZmZlY3Qg5pe277yM5aSW6YOoIGVmZmVjdCDlh73mlbDlpLHmlYhcclxuY29uc3QgZWZmZWN0U3RhY2sgPSBbXTtcclxuLy8g6K6w5b2V5b2T5YmN5omn6KGM55qE5Ymv5L2c55So5Ye95pWwXHJcbmxldCBhY3RpdmVFZmZlY3Q7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZWZmZWN0KGZuLCBvcHRpb25zID0ge30pIHtcclxuICAgIGNvbnN0IGVmZmVjdEZuID0gKCkgPT4ge1xyXG4gICAgICAgIC8vIOS7pemYsueUqOaIt+iHquWumuS5ieeahOWHveaVsOWHuumUme+8jOaJgOS7peimgSB0cnkgY2F0Y2hcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhY3RpdmVFZmZlY3QgPSBlZmZlY3RGbjtcclxuICAgICAgICAgICAgZWZmZWN0U3RhY2sucHVzaChhY3RpdmVFZmZlY3QpO1xyXG4gICAgICAgICAgICByZXR1cm4gZm4oKTtcclxuICAgICAgICB9IGZpbmFsbHkge1xyXG4gICAgICAgICAgICBlZmZlY3RTdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgYWN0aXZlRWZmZWN0ID0gZWZmZWN0U3RhY2tbZWZmZWN0U3RhY2subGVuZ3RoIC0gMV07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBpZighb3B0aW9ucy5sYXp5KSB7ICAgICAvLyDlm6DkuLogY29tcHV0ZWQg5piv57yT5a2Y5L6d6LWW5Ye95pWw55qE77yM562J6LCD55So5LqG5YC85omN5omn6KGM5L6d6LWW5Ye95pWwXHJcbiAgICAgICAgZWZmZWN0Rm4oKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8g6LCD5bqm5Ye95pWwKGNvbXB1dGVkKVxyXG4gICAgZWZmZWN0Rm4uc2NoZWR1bGVyID0gb3B0aW9ucy5zY2hlZHVsZXI7XHJcblxyXG4gICAgcmV0dXJuIGVmZmVjdEZuO1xyXG59XHJcblxyXG5jb25zdCB0YXJnZXRNYXAgPSBuZXcgV2Vha01hcCgpO1xyXG4vLyDkv53lrZjlia/kvZznlKjlh73mlbDkuK3nmoTkvp3otZYg77yI5L+d5a2Y5L6d6LWW77yJXHJcbmV4cG9ydCBmdW5jdGlvbiB0cmFjayh0YXJnZXQsa2V5KSB7XHJcbiAgICBpZighYWN0aXZlRWZmZWN0KSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRhcmdldE1hcCjkuIDkuKpXZWFrTWFwKSzplK7mmK/osIPnlKjnmoQgdGFyZ2V0IOWvueixoVxyXG4gICAgbGV0IGRlcHNNYXAgPSB0YXJnZXRNYXAuZ2V0KHRhcmdldCk7XHJcbiAgICBpZighZGVwc01hcCkge1xyXG4gICAgICAgIHRhcmdldE1hcC5zZXQodGFyZ2V0LChkZXBzTWFwID0gbmV3IE1hcCgpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8g5YC85pivIE1hcCAsIG1hcCDnmoTplK7mmK8g6LCD55So55qE5bGe5oCnIGtleSAsIOWAvOaYr+WJr+S9nOeUqOWHveaVsCDvvIjov5nmoLflsLHlj6/ku6Xmiorkvp3otZblu7rnq4votbfmnaXvvIlcclxuICAgIGxldCBkZXBzID0gZGVwc01hcC5nZXQoa2V5KTtcclxuICAgIGlmKCFkZXBzKSB7XHJcbiAgICAgICAgZGVwc01hcC5zZXQoa2V5LCAoZGVwcyA9IG5ldyBTZXQoKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGRlcHMuYWRkKGFjdGl2ZUVmZmVjdCk7ICAvLyDmt7vliqDlia/kvZznlKjlh73mlbAg5YiwIFNldCDkuK1cclxufVxyXG5cclxuLy8g55u45b2T5LqOIHRyYWNrIOeahOmAhui/kOeul++8jO+8iOaJp+ihjOS+nei1lu+8iVxyXG5leHBvcnQgZnVuY3Rpb24gdHJpZ2dlcih0YXJnZXQsIGtleSkge1xyXG4gICAgY29uc3QgZGVwc01hcCA9IHRhcmdldE1hcC5nZXQodGFyZ2V0KTtcclxuICAgIC8vIHRhcmdldCDmib7kuI3liLAg6K+05piOIHRhcmdldCDmsqHmnInkvp3otZZcclxuICAgIGlmKCFkZXBzTWFwKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGtleSDmib7kuI3liLAg6K+05piOIGtleSDmsqHmnInkvp3otZZcclxuICAgIGNvbnN0IGRlcHMgPSBkZXBzTWFwLmdldChrZXkpO1xyXG4gICAgaWYoIWRlcHMpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8g6IO95om+5b6X5Yiw77yM5bCx5oqK5omA5pyJ5L6d6LWW5Ye95pWw6YO95omn6KGM5LiA6YGNXHJcbiAgICBkZXBzLmZvckVhY2goZWZmZWN0Rm4gPT4ge1xyXG4gICAgICAgIGlmKGVmZmVjdEZuLnNjaGVkdWxlcikge1xyXG4gICAgICAgICAgICBlZmZlY3RGbi5zY2hlZHVsZXIoZWZmZWN0Rm4pOyBcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIGVmZmVjdEZuKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0iLCJleHBvcnQgeyBlZmZlY3QgfSBmcm9tICcuL2VmZmVjdCc7XHJcbmV4cG9ydCAqIGZyb20gJy4vcmVhY3RpdmUnO1xyXG5leHBvcnQgKiBmcm9tICcuL3JlZic7XHJcbmV4cG9ydCAqIGZyb20gJy4vY29tcHV0ZWQnOyIsImltcG9ydCB7XHJcbiAgICBoYXNDaGFuZ2VkLFxyXG4gICAgaXNBcnJheSxcclxuICAgIGlzT2JqZWN0XHJcbn0gZnJvbSBcIi4uL3V0aWxzXCI7XHJcbmltcG9ydCB7XHJcbiAgICB0cmFjayxcclxuICAgIHRyaWdnZXJcclxufSBmcm9tIFwiLi9lZmZlY3RcIjtcclxuXHJcbmNvbnN0IHByb3h5TWFwID0gbmV3IFdlYWtNYXAoKTsgLy8g5b2T6LCD55SoIHJlYWN0aXZlIOeahOWPguaVsOWvueixoeebuOWQjOaXtu+8jOi/lOWbnuWQjOS4gOS4quS7o+eQhuWvueixoSAo54m55L6LMilcclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWN0aXZlKHRhcmdldCkge1xyXG4gICAgLy8g5aaC5p6c5LiN5piv5a+56LGh77yM5bCx5Y6f5qC36L+U5ZueXHJcbiAgICBpZiAoIWlzT2JqZWN0KHRhcmdldCkpIHtcclxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIOmBv+WFjeW1jOWll+iwg+eUqCByZWFjdGl2ZSAgIHJlYWN0aXZlKHJlYWN0aXZlKG9iaikpIOWPqumcgOimgeS7o+eQhuS4gOasoSAo54m55L6LMSlcclxuICAgIGlmIChpc1JlYWN0aXZlKHRhcmdldCkpIHtcclxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChwcm94eU1hcC5oYXModGFyZ2V0KSkge1xyXG4gICAgICAgIHJldHVybiBwcm94eU1hcC5nZXQodGFyZ2V0KTsgLy8g5b2T6LCD55SoIHJlYWN0aXZlIOeahOWPguaVsOWvueixoeebuOWQjOaXtu+8jOi/lOWbnuWQjOS4gOS4quS7o+eQhuWvueixoVxyXG4gICAgfVxyXG5cclxuICAgIFxyXG4gICAgY29uc3QgcHJveHkgPSBuZXcgUHJveHkodGFyZ2V0LCB7XHJcbiAgICAgICAgZ2V0KHRhcmdldCwga2V5LCByZWNlaXZlcikge1xyXG4gICAgICAgICAgICBpZiAoa2V5ID09PSAnX19pc1JlYWN0aXZlJykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgcmVzID0gUmVmbGVjdC5nZXQodGFyZ2V0LCBrZXksIHJlY2VpdmVyKTtcclxuICAgICAgICAgICAgdHJhY2sodGFyZ2V0LCBrZXkpO1xyXG4gICAgICAgICAgICByZXR1cm4gaXNPYmplY3QocmVzKSA/IHJlYWN0aXZlKHJlcykgOiByZXM7ICAvLyDmt7HlsYLlr7nosaHku6PnkIbvvIjnibnkvos077yJXHJcbiAgICAgICAgICAgIC8vIOW9k+ivpeWxnuaAp+eahOWAvOS5n+S4uuWvueixoeaXtu+8jOWQjOaXtuacieWJr+S9nOeUqOWHveaVsOS+nei1luaXtu+8jOWGjeasoei/m+ihjOmAkuW9kuS7o+eQhlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0KHRhcmdldCwga2V5LCB2YWx1ZSwgcmVjZWl2ZXIpIHtcclxuICAgICAgICAgICAgbGV0IG9sZExlbmd0aCA9IHRhcmdldC5sZW5ndGg7XHJcbiAgICAgICAgICAgIGNvbnN0IG9sZFZhbHVlID0gdGFyZ2V0W2tleV07XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXMgPSBSZWZsZWN0LnNldCh0YXJnZXQsIGtleSwgdmFsdWUsIHJlY2VpdmVyKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOW9k+aWsOaXp+WAvOS4jeebuOWQjOaXtu+8jOehruWIh+eahOWPkeeUn+aUueWPmOaXtuaJjeinpuWPkeWJr+S9nOeUqOWHveaVsCAo54m55L6LMylcclxuICAgICAgICAgICAgaWYgKGhhc0NoYW5nZWQob2xkVmFsdWUsIHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdHJpZ2dlcih0YXJnZXQsIGtleSk7XHJcbiAgICAgICAgICAgICAgICBpZihpc0FycmF5KHRhcmdldCkgJiYgaGFzQ2hhbmdlZChvbGRMZW5ndGgsIHRhcmdldC5sZW5ndGgpKSB7ICAvLyDlvZPnm67moIfkuLrmlbDnu4Tml7bvvIxwdXNoIOaXtuaJi+WKqCB0cmlnZ2VyIGxlbmd0aCAo54m55L6LNSlcclxuICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyKHRhcmdldCwnbGVuZ3RoJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICBwcm94eU1hcC5zZXQodGFyZ2V0LCBwcm94eSk7XHJcbiAgICByZXR1cm4gcHJveHk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1JlYWN0aXZlKHRhcmdldCkge1xyXG4gICAgcmV0dXJuICEhKHRhcmdldCAmJiB0YXJnZXQuX19pc1JlYWN0aXZlKTtcclxufSIsImltcG9ydCB7IGhhc0NoYW5nZWQsIGlzT2JqZWN0IH0gZnJvbSBcIi4uL3V0aWxzXCI7XHJcbmltcG9ydCB7IHRyYWNrLCB0cmlnZ2VyIH0gZnJvbSBcIi4vZWZmZWN0XCI7XHJcbmltcG9ydCB7IHJlYWN0aXZlIH0gZnJvbSBcIi4vcmVhY3RpdmVcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZWYodmFsdWUpIHtcclxuICAgIGlmKGlzUmVmKHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IFJlZkltcGwodmFsdWUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNSZWYodmFsdWUpIHtcclxuICAgIHJldHVybiAhISh2YWx1ZSAmJiB2YWx1ZS5fX2lzUmVmKTtcclxufVxyXG5cclxuY2xhc3MgUmVmSW1wbCB7XHJcbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuX19pc1JlZiA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBjb252ZXJ0KHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgdmFsdWUoKSB7XHJcbiAgICAgICAgdHJhY2sodGhpcywgJ3ZhbHVlJyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCB2YWx1ZShuZXdWYWx1ZSkge1xyXG4gICAgICAgIGlmKGhhc0NoYW5nZWQobmV3VmFsdWUsIHRoaXMuX3ZhbHVlKSkgeyAgLy8g5b2T5paw5pen5YC85LiN5ZCM5pe277yM5omN6L+Q6KGM5L6d6LWW5Ye95pWwXHJcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gY29udmVydChuZXdWYWx1ZSk7XHJcbiAgICAgICAgICAgIHRyaWdnZXIodGhpcywgJ3ZhbHVlJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vLyDliKTmlq3mmK/lkKbmmK/lr7nosaHvvIzmmK/lr7nosaHlsLHosIPnlKggcmVhY3RpdmUg77yM5LiN5piv5YiZ5Y6f5qC36L+U5ZueXHJcbmZ1bmN0aW9uIGNvbnZlcnQodmFsdWUpIHtcclxuICAgIHJldHVybiBpc09iamVjdCh2YWx1ZSkgPyByZWFjdGl2ZSh2YWx1ZSkgOiB2YWx1ZTtcclxufSIsIi8vIOe7hOS7tuWwseaYr+S4gOS4qiB2bm9kZSAgdHlwZeaYr+WvueixoeeahOaXtuWAme+8jOS+i+WtkO+8mlxyXG4vLyBjb25zdCBDb21wb25lbnQgPSB7ICAgIC8vIOi/meWwseaYryAudnVlIOe7hOS7tuS4remFjee9rueahOe7hOS7tuS/oeaBr1xyXG4vLyAgICAgcHJvcHM6IFsnZm9vJ10sICAgICAvLyAxLiDov5nkuKogcHJvcHMg5bCx5piv5o6l5pS25LuO54i257uE5Lu25Lyg6L+H5p2l55qE5pWw5o2uIFxyXG4vLyAgICAgcmVuZGVyKGN0eCkgeyAgICAgIC8vIOaJi+WGmeeahCB0ZW1wbGF0ZSBcclxuLy8gICAgICAgICByZXR1cm4gaCgnZGl2JywgeyBjbGFzczogJ2EnLCBpZDogY3R4LmJhciB9LCBjdHguZm9vKTtcclxuLy8gICAgIH0sXHJcbi8vIH1cclxuLy8gY29uc3Qgdm5vZGVQcm9wcyA9IHsgICAgLy8gMi4g6L+Z5LiqIHZub2RlUHJvcHMg5piv54i257uE5Lu26LCD55So5a2Q57uE5Lu25pe25YaZ5Zyo5a2Q57uE5Lu26Lqr5LiK55qE5bGe5oCnXHJcbi8vICAgICBmb286ICdmb28nLFxyXG4vLyAgICAgYmFyOiAnYmFyJyxcclxuLy8gfTtcclxuLy8gY29uc3Qgdm5vZGUgPSBoKENvbXBvbmVudCwgdm5vZGVQcm9wcyk7ICAgLy8gQ29tcG9uZW50IOaYryB0eXBlICjku6Pmm7/kuYvliY3nmoQgJ2Rpdicg6L+Z5Lqb5qCH562+KVxyXG4vLyByZW5kZXIodm5vZGUsIGRvY3VtZW50LmJvZHkpO1xyXG5cclxuLy8gdXBkYXRlUHJvcHMoKSAgIOi/memHjOaYryBpbml0UHJvcHMoKVxyXG5cclxuaW1wb3J0IHsgY29tcGlsZSB9IGZyb20gJy4uL2NvbXBpbGVyJztcclxuaW1wb3J0IHtcclxuICAgIHJlYWN0aXZlLFxyXG4gICAgZWZmZWN0XHJcbn0gZnJvbSAnLi4vcmVhY3Rpdml0eSdcclxuaW1wb3J0IHsgcXVldWVKb2IgfSBmcm9tICcuL3NjaGVkdWxlcic7XHJcbmltcG9ydCB7XHJcbiAgICBub3JtYWxpemVWbm9kZVxyXG59IGZyb20gJy4vdm5vZGUnO1xyXG5cclxuZnVuY3Rpb24gaW5pdFByb3BzKGluc3RhbmNlLCB2bm9kZSkge1xyXG4gICAgY29uc3Qge1xyXG4gICAgICAgIHR5cGU6IENvbXBvbmVudCxcclxuICAgICAgICBwcm9wczogdm5vZGVQcm9wc1xyXG4gICAgfSA9IHZub2RlO1xyXG5cclxuICAgIC8vIOiuvue9rum7mOiupOWAvOS4uuepulxyXG4gICAgY29uc3QgcHJvcHMgPSAoaW5zdGFuY2UucHJvcHMgPSB7fSk7XHJcbiAgICBjb25zdCBhdHRycyA9IChpbnN0YW5jZS5hdHRycyA9IHt9KTtcclxuXHJcbiAgICAvLyDliKTmlq3niLboioLngrnkvKDov4fmnaXnmoTlsZ7mgKfvvIzlpoLmnpzmnInlnKggQ29tcG9uZW50LnByb3BzIOS4reacieWImeaUvuWIsCBwcm9wcyDph4zvvIzmsqHmnInliJnmlL7liLAgYXR0cnMg6YeMXHJcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB2bm9kZVByb3BzKSB7XHJcbiAgICAgICAgLy8g566A5Y2V55qE5oqKIHByb3BzIOWPquiuvuWumuS4uuaVsOe7hFxyXG4gICAgICAgIGlmIChDb21wb25lbnQucHJvcHM/LmluY2x1ZGVzKGtleSkpIHtcclxuICAgICAgICAgICAgcHJvcHNba2V5XSA9IHZub2RlUHJvcHNba2V5XTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhdHRyc1trZXldID0gdm5vZGVQcm9wc1trZXldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyB2dWUg5LitIHByb3BzIOaYr+WTjeW6lOW8j+eahFxyXG4gICAgaW5zdGFuY2UucHJvcHMgPSByZWFjdGl2ZShpbnN0YW5jZS5wcm9wcyk7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIG1vdW50Q29tcG9uZW50KHZub2RlLCBjb250YWluZXIsIGFuY2hvciwgcGF0Y2gpIHtcclxuICAgIGNvbnN0IHtcclxuICAgICAgICB0eXBlOiBDb21wb25lbnRcclxuICAgIH0gPSB2bm9kZTtcclxuXHJcbiAgICAvLyDlo7DmmI7nu4Tku7blrp7kvoss5oqK5a6e5L6L5pS+5YiwIHZub2RlIOS4iu+8jOWQjue7reWlveiwg+eUqCB1cGRhdGUg5pa55rOV5pu05pawXHJcbiAgICBjb25zdCBpbnN0YW5jZSA9ICh2bm9kZS5jb21wb25lbnQgPSB7XHJcbiAgICAgICAgcHJvcHM6IG51bGwsXHJcbiAgICAgICAgYXR0cnM6IG51bGwsXHJcbiAgICAgICAgc2V0dXBTdGF0ZTogbnVsbCwgLy8g5Yik5pat5piv5ZCm5pyJIHNldHVwIOWHveaVsO+8jOi1i+WAvOS4uuWFtui/lOWbnuWAvFxyXG4gICAgICAgIGN0eDogbnVsbCwgLy8g5piv5qih5p2/5riy5p+T5pe255qE5Y+C5pWwIHJlbmRlcihjdHgpXHJcbiAgICAgICAgc3ViVHJlZTogbnVsbCwgLy8g5L+d5a2Y5LiK5qyh57uT54K577yM5Lul5L6/5pu05paw5pON5L2cXHJcbiAgICAgICAgaXNNb3VudGVkOiBmYWxzZSwgLy8g5Yik5pat5piv5ZCm56ys5LiA5qyh5Yqg6L29XHJcbiAgICAgICAgdXBkYXRlOiBudWxsLCAvLyDmm7TmlrDlh73mlbBcclxuICAgICAgICBuZXh0OiBudWxsLCAgLy8g5Yik5pat5piv5Li75Yqo5pu05paw6L+Y5piv6KKr5Yqo5pu05paw77yI5a2Y5YKoIG4y77yJXHJcbiAgICB9KTtcclxuXHJcbiAgICBpbml0UHJvcHMoaW5zdGFuY2UsIHZub2RlKTtcclxuXHJcbiAgICAvLyBzZXR1cCDlh73mlbDmjqXmlLbkuKTkuKrlj4LmlbDvvIzkuIDkuKrmmK8gcHJvcHMgLOS4gOS4quaYr+S4iuS4i+aWh+WvueixoSBjb250ZXh0ID0geyBhdHRycywgc2xvdHMsIGVtaXQsIGV4cG9zZSB9LCDov5nph4znroDljJbkuLrlj6rmnIkgYXR0cnNcclxuICAgIC8vIHNldHVwIOS4jeS4gOWumuacie+8jOimgeeci+WumuS5iSBDb21wb25lbnQg55qE5pe25YCZ5piv5ZCm5pyJ5a6a5LmJXHJcbiAgICBpbnN0YW5jZS5zZXR1cFN0YXRlID0gQ29tcG9uZW50LnNldHVwPy4oaW5zdGFuY2UucHJvcHMsIHtcclxuICAgICAgICBhdHRyczogaW5zdGFuY2UuYXR0cnNcclxuICAgIH0pXHJcblxyXG4gICAgaW5zdGFuY2UuY3R4ID0ge1xyXG4gICAgICAgIC4uLmluc3RhbmNlLnByb3BzLFxyXG4gICAgICAgIC4uLmluc3RhbmNlLnNldHVwU3RhdGVcclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYoIUNvbXBvbmVudC5yZW5kZXIgJiYgQ29tcG9uZW50LnRlbXBsYXRlKSB7XHJcbiAgICAgICAgbGV0IHsgdGVtcGxhdGUgfSA9IENvbXBvbmVudDtcclxuICAgICAgICBpZih0ZW1wbGF0ZVswXSA9PT0gJyMnKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0ZW1wbGF0ZSk7XHJcbiAgICAgICAgICAgIHRlbXBsYXRlID0gZWwgPyBlbC5pbm5lckhUTUwgOiAnJztcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgY29kZSA9IGNvbXBpbGUodGVtcGxhdGUpO1xyXG4gICAgICAgIENvbXBvbmVudC5yZW5kZXIgPSBuZXcgRnVuY3Rpb24oJ2N0eCcsIGNvZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIOmAmui/hyBlZmZjdCDljIXoo7nvvIzov5nmoLfkuIDml6bmnInlk43lupTlvI/lj5jph4/lj5HnlJ/mlLnlj5jnmoTml7blgJnvvIzpg73kvJrop6blj5EgdXBkYXRlIOWHveaVsFxyXG4gICAgaW5zdGFuY2UudXBkYXRlID0gZWZmZWN0KCgpID0+IHtcclxuICAgICAgICAvLyB1cGRhdGUg6LefIG1vdW50ZWQg5YW25a6e5b6I5YOP77yM5Y+q5piv5bCx5pivIHBhdGNoIOaWsOaXp+e7k+eCueiAjOW3su+8jOaJgOS7peiuvue9ruS4gOS4quagh+iusCBpc01vdW50ZWQg5Yik5pat77yM54S25ZCO5bCG5LqM6ICF5pW05ZCI5Zyo5LiA6LW377yM5ZCM5pe255Sx5LqOIGVmZmVjdCDlroPpppbmrKHmmK/kvJrmiafooYznmoTvvIzliJrlpb3lsLHmmK8gbW91bnRcclxuICAgICAgICBpZiAoIWluc3RhbmNlLmlzTW91bnRlZCkge1xyXG4gICAgICAgICAgICAvLyBtb3VudCAg5omn6KGM57uE5Lu25Lit55qEIHJlbmRlciDlh73mlbDvvIzmuLLmn5Plh7rmqKHmnb8s5b6X5Yiw6Jma5oufZG9tIHZub2RlXHJcbiAgICAgICAgICAgIGNvbnN0IHN1YlRyZWUgPSAoaW5zdGFuY2Uuc3ViVHJlZSA9IG5vcm1hbGl6ZVZub2RlKENvbXBvbmVudC5yZW5kZXIoaW5zdGFuY2UuY3R4KSkpO1xyXG4gICAgICAgICAgICBmYWxsVGhyb3VnaChpbnN0YW5jZSwgc3ViVHJlZSk7XHJcblxyXG4gICAgICAgICAgICAvLyDku44gcmVuZGVyLmpzIOS4reS8oOi/h+adpeeahCBwYXRjaCDlh73mlbDvvIzlr7kgdm5vZGUg6L+b6KGMIG1vdW50IOWKoOi9vVxyXG4gICAgICAgICAgICBwYXRjaChudWxsLCBzdWJUcmVlLCBjb250YWluZXIsIGFuY2hvcik7XHJcbiAgICAgICAgICAgIHZub2RlLmVsID0gc3ViVHJlZS5lbDtcclxuICAgICAgICAgICAgaW5zdGFuY2UuaXNNb3VudGVkID0gdHJ1ZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyB1cGRhdGUg5pu05pawXHJcbiAgICAgICAgICAgIGlmKGluc3RhbmNlLm5leHQpIHtcclxuICAgICAgICAgICAgICAgIC8vIOiiq+WKqOabtOaWsO+8muWIq+eahOe7hOS7tuWPkeeUn+aUueWPmO+8jOiHquW3seeahOebuOWvueW6lOWPmOmHj+S5n+imgeWPkeeUn+aUueWPmFxyXG4gICAgICAgICAgICAgICAgLy8g6L+Z6YeM5Li76KaB55qE54K55piv6KaB6I635Y+W5YiwIG4yIOe7k+eCue+8jOS4jeeEtiB2bm9kZSDkuIDnm7Tpg73mmK8gbjEg77yI5Yid5aeL57uT54K577yJ77yM5Zug5Li6IGZ1bmN0aW9uIHVwZGF0ZUNvbXBvbmVudChuMSxuMikg5piv55u05o6l6LCD55So5a6e5L6L5Lit55qEIHVwZGF0ZSDlh73mlbDvvIzmsqHmnInkvKDlj4LnmoTov4fnqItcclxuICAgICAgICAgICAgICAgIC8vIOeEtuWQjuaKiuaJgOaciSBwcm9wcyDlsZ7mgKfpg73opoHph43mlrDliJ3lp4vljJbkuIDpgY1cclxuICAgICAgICAgICAgICAgIHZub2RlID0gaW5zdGFuY2UubmV4dDtcclxuICAgICAgICAgICAgICAgIGluc3RhbmNlLm5leHQgPSBudWxsOyAgLy8g5riF56m677yM5Lul6Ziy5LiL5qyh5LiA55u06L+b5YWlXHJcbiAgICAgICAgICAgICAgICBpbml0UHJvcHMoaW5zdGFuY2UsIHZub2RlKTtcclxuICAgICAgICAgICAgICAgIGluc3RhbmNlLmN0eCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAuLi5pbnN0YW5jZS5wcm9wcyxcclxuICAgICAgICAgICAgICAgICAgICAuLi5pbnN0YW5jZS5zZXR1cFN0YXRlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgIC8vIOS4u+WKqOabtOaWsO+8muiHquW3see7hOS7tuWGhemDqOWPkeeUn+aUueWPmFxyXG4gICAgICAgICAgICBjb25zdCBwcmV2ID0gaW5zdGFuY2Uuc3ViVHJlZTtcclxuICAgICAgICAgICAgY29uc3Qgc3ViVHJlZSA9IChpbnN0YW5jZS5zdWJUcmVlID0gbm9ybWFsaXplVm5vZGUoQ29tcG9uZW50LnJlbmRlcihpbnN0YW5jZS5jdHgpKSk7XHJcbiAgICAgICAgICAgIGZhbGxUaHJvdWdoKGluc3RhbmNlLCBzdWJUcmVlKTtcclxuICAgICAgICAgICAgcGF0Y2gocHJldiwgc3ViVHJlZSwgY29udGFpbmVyLCBhbmNob3IpO1xyXG4gICAgICAgICAgICB2bm9kZS5lbCA9IHN1YlRyZWUuZWw7XHJcbiAgICAgICAgfVxyXG4gICAgfSx7XHJcbiAgICAgICAgc2NoZWR1bGVyOiBxdWV1ZUpvYiwgICAvLyDosIPluqblh73mlbDvvIzlpI3nlKggY29tcHV0ZWQg55qE6LCD5bqm77yM6K6p5a6D5pivIGxhenkg55qE77yM6LCD5bqm57uT5p2f5ZCO5YaN6L+b6KGM5pu05paw77yM6L+Z5qC35Y+v5Lul6YG/5YWN77yM5q+P5qyh5YC85Y+R55Sf5Y+Y5YyW5bCx5b6X6YeN5pawIHJlbmRlciDkuIDpgY1cclxuICAgIH0pXHJcbn1cclxuXHJcbi8vIOWPquaYr+aPkOWPluWFrOWFsemDqOWIhu+8jOeugOWMluS7o+eggeiAjOW3slxyXG5mdW5jdGlvbiBmYWxsVGhyb3VnaChpbnN0YW5jZSwgc3ViVHJlZSkge1xyXG4gICAgLy8g5aaC5p6c5pyJIGF0dHJzIOeahOivne+8jOWwseaKiuWxnuaAp+aMgui9veWIsOagueiKgueCueS4ilxyXG4gICAgaWYgKE9iamVjdC5rZXlzKGluc3RhbmNlLmF0dHJzKS5sZW5ndGgpIHtcclxuICAgICAgICBzdWJUcmVlLnByb3BzID0ge1xyXG4gICAgICAgICAgICAuLi5zdWJUcmVlLnByb3BzLFxyXG4gICAgICAgICAgICAuLi5pbnN0YW5jZS5hdHRycyxcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBoLCByZW5kZXIgfSBmcm9tICcuJ1xyXG5pbXBvcnQgeyBpc1N0cmluZyB9IGZyb20gXCIuLi91dGlsc1wiXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQXBwKHJvb3RDb21wb25lbnQpIHtcclxuICAgIGNvbnN0IGFwcCA9IHtcclxuICAgICAgICBtb3VudChyb290Q29udGFpbmVyKSB7XHJcbiAgICAgICAgICAgIGlmKGlzU3RyaW5nKHJvb3RDb250YWluZXIpKSB7XHJcbiAgICAgICAgICAgICAgICByb290Q29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihyb290Q29udGFpbmVyKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8g5b2T5rKh5pyJIHJlbmRlciDlh73mlbDkuZ/msqHmnIkgdGVtcGxhdGUg5qih5p2/5pe277yM5Yqg6L295a655Zmo6YeM6Z2i55qE5YaF5a655Li6IHRlbXBsYXRlXHJcbiAgICAgICAgICAgIGlmKCFyb290Q29tcG9uZW50LnJlbmRlciAmJiAhcm9vdENvbXBvbmVudC50ZW1wbGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgcm9vdENvbXBvbmVudC50ZW1wbGF0ZSA9IHJvb3RDb250YWluZXIuaW5uZXJIVE1MO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJvb3RDb250YWluZXIuaW5uZXJIVE1MID0gJyc7ICAgIC8vIOimgeaKiuWOn+acrOeahOWIoOaOie+8jOmBv+WFjeWKoOi9veS4pOasoVxyXG5cclxuICAgICAgICAgICAgcmVuZGVyKGgocm9vdENvbXBvbmVudCksIHJvb3RDb250YWluZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYXBwO1xyXG59IiwiaW1wb3J0IHsgaXNBcnJheSwgaXNOdW1iZXIsIGlzT2JqZWN0LCBpc1N0cmluZyB9IGZyb20gXCIuLi8uLi91dGlsc1wiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckxpc3Qoc291cmNlLCByZW5kZXJJdGVtKSB7XHJcbiAgICAvLyB2LWZvciDmjIfku6TkuK0gaXRlbXMg5Y+v5Lul5pyJ5Zub56eN5LiN5ZCM5oOF5Ya1XHJcbiAgICAvLyBpdGVtIGluIGl0ZW1zIEFycmF5XHJcbiAgICAvLyBpdGVtIGluIG9iaiAgT2JqZWN0XHJcbiAgICAvLyBpdGVtIGluIDEwICAgTnVtYmVyXHJcbiAgICAvLyBpdGVtIGluICdhYmNlZGUnICAgc3RyaW5nXHJcblxyXG4gICAgY29uc3Qgbm9kZXMgPSBbXTtcclxuICAgIGlmKGlzTnVtYmVyKHNvdXJjZSkpIHtcclxuICAgICAgICBmb3IobGV0IGkgPSAwO2kgPCBzb3VyY2U7aSsrKSB7XHJcbiAgICAgICAgICAgIG5vZGVzLnB1c2gocmVuZGVySXRlbShpICsgMSxpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIGlmKGlzU3RyaW5nKHNvdXJjZSkgfHwgaXNBcnJheShzb3VyY2UpKSB7XHJcbiAgICAgICAgZm9yKGxldCBpID0gMDtpIDwgc291cmNlO2krKykge1xyXG4gICAgICAgICAgICBub2Rlcy5wdXNoKHJlbmRlckl0ZW0oc291cmNlW2ldLGkpKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYoaXNPYmplY3Qoc291cmNlKSkge1xyXG4gICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhzb3VyY2UpO1xyXG4gICAgICAgIGtleXMuZm9yRWFjaCgoa2V5LCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICBub2Rlcy5wdXNoKHJlbmRlckl0ZW0oc291cmNlW2tleV0sIGtleSwgaW5kZXgpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbm9kZXM7XHJcbn0iLCJleHBvcnQgeyBoLCBUZXh0LCBGcmFnbWVudCB9IGZyb20gXCIuL3Zub2RlXCJcclxuZXhwb3J0IHsgcmVuZGVyIH0gZnJvbSAnLi9yZW5kZXInXHJcbmV4cG9ydCB7IHF1ZXVlSm9iLCBuZXh0VGljayB9IGZyb20gJy4vc2NoZWR1bGVyJ1xyXG5leHBvcnQgeyBjcmVhdGVBcHAgfSBmcm9tICcuL2NyZWF0ZUFwcCdcclxuZXhwb3J0IHsgcmVuZGVyTGlzdCB9IGZyb20gJy4vaGVscGVycy9yZW5kZXJMaXN0JyIsIi8qICBwcm9wcyDlj4LnhadcclxuICAgIHtcclxuICAgICAgICBjbGFzczogJ2J0bicsXHJcbiAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgY29sb3I6ICdyZWQnLFxyXG4gICAgICAgICAgICBmb250U2l6ZTogJzE0cHgnLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25DbGljazogKCkgPT4gY29uc29sZS5sb2coJ2NsaWNrJyksXHJcbiAgICAgICAgY2hlY2tlZDogJycsXHJcbiAgICAgICAgY3VzdG9tOiBmYWxzZVxyXG4gICAgfVxyXG4qL1xyXG5cclxuaW1wb3J0IHtcclxuICAgIGlzQm9vbGVhblxyXG59IGZyb20gXCIuLi91dGlsc1wiO1xyXG5cclxuLy8g5Yik5pat5piv55u05o6lIGVsLmtleSA9IHZhbHVlIOi/mOaYr+W+lyBlbC5zZXRBdHRyaWJ1dGUoa2V5LHZhbHVlKVxyXG5jb25zdCBkb21Qcm9wc1JFID0gL1tBLVpdIHwgXih2YWx1ZSB8IGNoZWNrZWQgfCBzZWxlY3RlZCB8IG11dGVkIHwgZGlzYWJsZWQpJC87XHJcbi8vIOabtOaWsOe7k+eCuSB2bm9kZSDnmoQgcHJvcHMgXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXRjaFByb3BzKG9sZFByb3BzLCBuZXdQcm9wcywgZWwpIHtcclxuICAgIC8vIOWvueavlOWJjeWQjiBwcm9wcyDlr7nosaHmmK/lkKbnm7jnrYnvvIznm7jnrYnliJnov5Tlm55cclxuICAgIGlmIChvbGRQcm9wcyA9PT0gbmV3UHJvcHMpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8g6YG/5YWN5a+56LGh5Li6IG51bGxcclxuICAgIG9sZFByb3BzID0gb2xkUHJvcHMgfHwge307XHJcbiAgICBuZXdQcm9wcyA9IG5ld1Byb3BzIHx8IHt9O1xyXG5cclxuICAgIC8vIOS4jeebuOetieWImemBjeWOhuWvueixoeS4reeahOavj+S4quWxnuaAp++8jOS9v+eUqCBwYXRjaERvbVByb3Ag6L+b6KGM5q+U6L6DXHJcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBuZXdQcm9wcykge1xyXG4gICAgICAgIGlmKGtleSA9PT0gJ2tleScpIHsgICAvLyBrZXkg5bGe5oCn5LiN55So5Yik5pat77yM54m55q6KXHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbmV4dCA9IG5ld1Byb3BzW2tleV07XHJcbiAgICAgICAgY29uc3QgcHJldiA9IG9sZFByb3BzW2tleV07XHJcblxyXG4gICAgICAgIGlmIChwcmV2ICE9PSBuZXh0KSB7XHJcbiAgICAgICAgICAgIHBhdGNoRG9tUHJvcChwcmV2LCBuZXh0LCBrZXksIGVsKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgXHJcbiAgICAvLyDnp7vpmaTmjonml6cgcHJvcHMg5Lit5pyJ6ICM5pawIHByb3BzIOS4reayoeacieeahOWxnuaAp1xyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gb2xkUHJvcHMpIHtcclxuICAgICAgICBpZiAoa2V5ICE9PSAna2V5JyAmJiAhKGtleSBpbiBuZXdQcm9wcykpIHtcclxuICAgICAgICAgICAgcGF0Y2hEb21Qcm9wKG9sZFByb3BzW2tleV0sIG51bGwsIGtleSwgZWwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLy8g5pu05pawIHZub2RlIOS4rSBwcm9wcyDnmoTmr4/kuKrlsZ7mgKflgLxcclxuZnVuY3Rpb24gcGF0Y2hEb21Qcm9wKHByZXYsIG5leHQsIGtleSwgZWwpIHtcclxuICAgIHN3aXRjaCAoa2V5KSB7XHJcbiAgICAgICAgY2FzZSAnY2xhc3MnOlxyXG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgPSBuZXh0IHx8ICcnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdzdHlsZSc6XHJcbiAgICAgICAgICAgIGlmIChuZXh0ID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZSgnc3R5bGUnKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc3R5bGVOYW1lIGluIG5leHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbC5zdHlsZVtzdHlsZU5hbWVdID0gbmV4dFtzdHlsZU5hbWVdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIOWIoOmZpOaOie+8jG5leHQg5Lit5rKh5pyJ6ICMIHByZSDkuK3mnInnmoQgc3R5bGUg5bGe5oCnXHJcbiAgICAgICAgICAgICAgICBpZiAocHJldikge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc3R5bGVOYW1lIGluIHByZXYpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5leHRbc3R5bGVOYW1lXSA9PT0gbnVsbCB8fCBuZXh0W3N0eWxlTmFtZV0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwuc3R5bGVbc3R5bGVOYW1lXSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGlmICgvXm9uW15hLXpdLy50ZXN0KGtleSkpIHtcclxuICAgICAgICAgICAgICAgIC8vIOaDheWGtTHvvJrliKTmlq3kuovku7ZcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50TmFtZSA9IGtleS5zbGljZSgyKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgICAgLy8g55u05o6l5oqK5pen5LqL5Lu256e76Zmk77yM54S25ZCO5re75Yqg5paw5LqL5Lu2XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldikge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShldmVudE5hbWUsIHByZXYpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKG5leHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgbmV4dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZG9tUHJvcHNSRS50ZXN0KGtleSkpIHtcclxuICAgICAgICAgICAgICAgIC8vIOaDheWGtTLvvJrliKTmlq0gY2hlY2tlZCBzZWxlY3RlZCDov5nnp43lj6/ku6Xnm7TmjqUgZG9jLmNoZWNrZWQgPSB0cnVlIOWumuS5ieeahOWxnuaAp1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIOW9k+eUqOaIt+WPquWGmeS6hiBjaGVja2VkIOaXtuS8muino+aekOaIkCB7J2NoZWNrZWQnIDogJyd9ICjnibnkvosxKVxyXG4gICAgICAgICAgICAgICAgaWYgKG5leHQgPT09ICcnICYmIGlzQm9vbGVhbihlbFtrZXldKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG5leHQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxba2V5XSA9IG5leHQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyDmg4XlhrUz77ya5Yik5pat6Ieq5a6a5LmJ5bGe5oCn77yM5LiA5a6a5b6X55SoIHNldEF0dHJpYnV0ZSDlu7rnq4vnmoTlsZ7mgKdcclxuXHJcbiAgICAgICAgICAgICAgICAvLyDlvZPoh6rlrprkuYnlsZ7mgKcgeyBjdXN0b20gOiBmYWxzZSB9LOino+aekOWQjiBmYWxzZSDkvJrlj5jmiJDlrZfnrKbkuLLvvIzmiYDku6XliKTmlq3lh7rmnaXov5jmmK8gdHJ1ZSAo54m55L6LMilcclxuICAgICAgICAgICAgICAgIGlmIChuZXh0ID09IG51bGwgfHwgbmV4dCA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoa2V5KTsgLy8g55u05o6l5oqK6K+l5bGe5oCn5LuO5YWD57Sg5LiK56e76ZmkXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZShrZXksIG5leHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHtcclxuICAgIFNoYXBlRmxhZ3NcclxufSBmcm9tIFwiLi92bm9kZVwiO1xyXG5pbXBvcnQge1xyXG4gICAgcGF0Y2hQcm9wc1xyXG59IGZyb20gXCIuL3BhdGNoUHJvcHNcIjtcclxuXHJcbmltcG9ydCB7IG1vdW50Q29tcG9uZW50IH0gZnJvbSAnLi9jb21wb25lbnQnXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyKHZub2RlLCBjb250YWluZXIpIHtcclxuICAgIC8vIOWvueavlOWJjeWQjue7k+eCuVxyXG4gICAgY29uc3QgcHJldlZOb2RlID0gY29udGFpbmVyLl92bm9kZTtcclxuICAgIC8vIOWmguaenOW9k+WJjee7k+eCueS4jeWtmOWcqO+8jOiAjOS5i+WJjeacieivpeiZmuaLn2Rvbe+8jOaAjuS5iOWNuOi9veWOn+adpeeahOe7k+eCuVxyXG4gICAgaWYgKCF2bm9kZSkge1xyXG4gICAgICAgIGlmIChwcmV2Vk5vZGUpIHtcclxuICAgICAgICAgICAgdW5tb3VudChwcmV2Vk5vZGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8g5aaC5p6c5YmN5ZCO57uT54K56YO95a2Y5Zyo77yM5bCx5a+55q+U5beu5byC77yM6L+b6KGM5pu05pawXHJcbiAgICAgICAgcGF0Y2gocHJldlZOb2RlLCB2bm9kZSwgY29udGFpbmVyKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyDorrDlvZXmm7TmlrDlkI7nmoTnu5PngrnvvIzkuLrkuIvmrKHmm7TmlrDml7bmj5Dkvpvljp/mnKznu5PngrnmlbDmja5cclxuICAgIGNvbnRhaW5lci5fdm5vZGUgPSB2bm9kZTtcclxufVxyXG5cclxuZnVuY3Rpb24gdW5tb3VudCh2bm9kZSkge1xyXG4gICAgY29uc3Qge1xyXG4gICAgICAgIHNoYXBlRmxhZyxcclxuICAgICAgICBlbFxyXG4gICAgfSA9IHZub2RlO1xyXG4gICAgaWYgKHNoYXBlRmxhZyAmIFNoYXBlRmxhZ3MuQ09NUE9ORU5UKSB7XHJcbiAgICAgICAgdW5tb3VudENvbXBvbmVudCh2bm9kZSk7XHJcbiAgICB9IGVsc2UgaWYgKHNoYXBlRmxhZyAmIFNoYXBlRmxhZ3MuRlJBR01FTlQpIHtcclxuICAgICAgICB1bm1vdW50RnJhZ21lbnQodm5vZGUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyDliankuIvnmoTlj6/ku6Xnm7TmjqXkvb/nlKggcmVtb3ZlQ2hpbGQg5Yig6Zmk57uT54K5XHJcbiAgICAgICAgZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVubW91bnRGcmFnbWVudCh2bm9kZSkge1xyXG4gICAgbGV0IHtcclxuICAgICAgICBlbDogY3VyLFxyXG4gICAgICAgIGFuY2hvcjogZW5kXHJcbiAgICB9ID0gdm5vZGU7XHJcbiAgICBjb25zdCBwYXJlbnROb2RlID0gY3VyLnBhcmVudE5vZGU7XHJcblxyXG4gICAgd2hpbGUgKGN1ciAhPT0gZW5kKSB7XHJcbiAgICAgICAgbGV0IG5leHQgPSBjdXIubmV4dFNpYmxpbmc7IC8vIG5leHQg6K6+572u5Li65YWE5byf57uT54K5XHJcbiAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjdXIpO1xyXG4gICAgICAgIGN1ciA9IG5leHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbmQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1bm1vdW50Q2hpbGRyZW4oY2hpbGRyZW4pIHtcclxuICAgIGNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB7XHJcbiAgICAgICAgdW5tb3VudChjaGlsZCk7XHJcbiAgICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiB1bm1vdW50Q29tcG9uZW50KHZub2RlKSB7XHJcbiAgICB1bm1vdW50KHZub2RlLmNvbXBvbmVudC5zdWJUcmVlKTtcclxufVxyXG5cclxuLy8g5pu05paw5pON5L2cXHJcbmZ1bmN0aW9uIHBhdGNoKG4xLCBuMiwgY29udGFpbmVyLCBhbmNob3IpIHtcclxuICAgIC8vIOWIpOaWrSBuMSDlkowgbjIg55qE57G75Z6L5piv5ZCm55u45ZCM77yM6KaB5piv5LiN55u45ZCM77yM5bCx55u05o6l5oqKIG4xIOWNuOi9vVxyXG4gICAgaWYgKG4xICYmICFpc1NhbWVWTm9kZShuMSwgbjIpKSB7XHJcbiAgICAgICAgYW5jaG9yID0gKG4xLmFuY2hvciB8fCBuMS5lbCkubmV4dFNpYmxpbmc7IC8vIOimgeWIoOmZpOivpee7k+eCueS5i+WJje+8jOimgeiuvue9ruWlvSBhbmNob3Ig55qE5oyH5ZCRXHJcbiAgICAgICAgdW5tb3VudChuMSk7XHJcbiAgICAgICAgbjEgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHtcclxuICAgICAgICBzaGFwZUZsYWdcclxuICAgIH0gPSBuMjtcclxuICAgIGlmIChzaGFwZUZsYWcgJiBTaGFwZUZsYWdzLkNPTVBPTkVOVCkge1xyXG4gICAgICAgIHByb2Nlc3NDb21wb25lbnQobjEsIG4yLCBjb250YWluZXIsIGFuY2hvcik7XHJcbiAgICB9IGVsc2UgaWYgKHNoYXBlRmxhZyAmIFNoYXBlRmxhZ3MuVEVYVCkge1xyXG4gICAgICAgIHByb2Nlc3NUZXh0KG4xLCBuMiwgY29udGFpbmVyLCBhbmNob3IpO1xyXG4gICAgfSBlbHNlIGlmIChzaGFwZUZsYWcgJiBTaGFwZUZsYWdzLkZSQUdNRU5UKSB7XHJcbiAgICAgICAgcHJvY2Vzc0ZyYWdtZW50KG4xLCBuMiwgY29udGFpbmVyLCBhbmNob3IpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBwcm9jZXNzRWxlbWVudChuMSwgbjIsIGNvbnRhaW5lciwgYW5jaG9yKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8g5Yik5pat5paw5pen57uT54K557G75Z6L5piv5ZCm55u45ZCMXHJcbmZ1bmN0aW9uIGlzU2FtZVZOb2RlKG4xLCBuMikge1xyXG4gICAgcmV0dXJuIG4xLnR5cGUgPT09IG4yLnR5cGU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByb2Nlc3NDb21wb25lbnQobjEsIG4yLCBjb250YWluZXIsIGFuY2hvcikge1xyXG4gICAgaWYobjEpIHtcclxuICAgICAgICAvLyDliY3pnaLov5jopoHliKTmlq3kuIDkuIvmmK/lkKbnnJ/nmoTpnIDopoHmm7TmlrAgIHNob3VsZFVwZGF0ZUNvbXBvbmVudCAgVnVl5piv5YaF572u77yM5YaF6YOo6Ieq5bex5Yik5pat55qEXHJcbiAgICAgICAgLy8g5Zug5Li65aaC5p6c55yf5q2j55So5Yiw55qE6YKj5Liq6YOo5YiGIHByb3BzIOayoeacieabtOaUueeahOivne+8jOWFtuWunuS4jeeUqOiiq+WKqOabtOaWsFxyXG4gICAgICAgIHVwZGF0ZUNvbXBvbmVudChuMSxuMik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1vdW50Q29tcG9uZW50KG4yLCBjb250YWluZXIsIGFuY2hvciwgcGF0Y2gpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVDb21wb25lbnQobjEsbjIpIHtcclxuICAgIG4yLmNvbXBvbmVudCA9IG4xLmNvbXBvbmVudDsgIC8vIOWFiOe7p+aJvyBuMSDnmoQgY29tcG9uZW50LCDmjqXkuIvmnaXmiY3lj6/ku6XosIPnlKgg5a6e5L6L5LiK55qEIHVwZGF0ZSDlh73mlbBcclxuICAgIG4yLmNvbXBvbmVudC5uZXh0ID0gbjI7XHJcbiAgICBuMi5jb21wb25lbnQudXBkYXRlKCk7ICAgLy8g5rKh5pyJ5Lyg5Y+C6L+H56iL77yM5omA5Lul5YiwIHVwZGF0ZSDkuK3opoEgdm5vZGUg6KaB5o2i5oiQIG4yXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByb2Nlc3NUZXh0KG4xLCBuMiwgY29udGFpbmVyLCBhbmNob3IpIHtcclxuICAgIGlmIChuMSkge1xyXG4gICAgICAgIC8vIOaKiuWOn+acrCBuMSDnmoQgZWwg57uZIG4yXHJcbiAgICAgICAgbjIuZWwgPSBuMS5lbDtcclxuICAgICAgICAvLyDnm7TmjqXkv67mlLkgbjEg55qE5YaF5a655Li6IG4yLmNoaWxkcmVuIOWNs+WPr1xyXG4gICAgICAgIG4xLmVsLnRleHRDb250ZW50ID0gbjIuY2hpbGRyZW47XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1vdW50VGV4dE5vZGUobjIsIGNvbnRhaW5lciwgYW5jaG9yKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcHJvY2Vzc0ZyYWdtZW50KG4xLCBuMiwgY29udGFpbmVyLCBhbmNob3IpIHtcclxuICAgIC8vIOW9kyBuMSDmsqHmnIkgZWwg5ZKMIGFuY2hvciDml7bvvIwo5Zug5Li65aaC5p6cIHBhdGNoIOW+iOWkmuasoeeahOivne+8jG4xIOWwseS8muaciSBlbCDlkowgYW5jaG9yKVxyXG4gICAgLy8g5omL5Yqo5bu656uL5Lik5Liq57uT54K55YyF6KO5IGZyYWdtZW50IOi/meagt+WwseiDveS7jui/meS4pOS4quiKgueCueS4remXtOaPkuWFpe+8jOiAjOS4jeaYr+ebtOaOpeaPkuWFpeWIsOWuueWZqOeahOacq+Wwvu+8jOWvvOiHtOmhuuW6j+mUmeS5sVxyXG4gICAgY29uc3QgZnJhZ21lbnRTdGFydEFuY2hvciA9IG4xID8gbjEuZWwgOiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7IC8vIGVsXHJcbiAgICBjb25zdCBmcmFnbWVudEVuZEFuY2hvciA9IG4xID8gbjEuYW5jaG9yIDogZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpOyAvLyBhbmNob3JcclxuXHJcbiAgICBuMi5lbCA9IGZyYWdtZW50U3RhcnRBbmNob3I7XHJcbiAgICBuMi5hbmNob3IgPSBmcmFnbWVudEVuZEFuY2hvcjtcclxuXHJcbiAgICBpZiAobjEpIHtcclxuICAgICAgICBwYXRjaENoaWxkcmVuKG4xLCBuMiwgY29udGFpbmVyLCBmcmFnbWVudEVuZEFuY2hvcik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIGNvbnRhaW5lci5hcHBlbmRDaGlsZChmcmFnbWVudFN0YXJ0QW5jaG9yKTtcclxuICAgICAgICAvLyBjb250YWluZXIuYXBwZW5kQ2hpbGQoZnJhZ21lbnRFbmRBbmNob3IpO1xyXG4gICAgICAgIGNvbnRhaW5lci5pbnNlcnRCZWZvcmUoZnJhZ21lbnRFbmRBbmNob3IsIGFuY2hvcik7XHJcbiAgICAgICAgY29udGFpbmVyLmluc2VydEJlZm9yZShmcmFnbWVudFN0YXJ0QW5jaG9yLCBhbmNob3IpO1xyXG4gICAgICAgIG1vdW50Q2hpbGRyZW4objIuY2hpbGRyZW4sIGNvbnRhaW5lciwgZnJhZ21lbnRFbmRBbmNob3IpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBwcm9jZXNzRWxlbWVudChuMSwgbjIsIGNvbnRhaW5lciwgYW5jaG9yKSB7XHJcbiAgICBpZiAobjEpIHtcclxuICAgICAgICBwYXRjaEVsZW1lbnQobjEsIG4yKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbW91bnRFbGVtZW50KG4yLCBjb250YWluZXIsIGFuY2hvcik7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIOWIm+W7uuaMgui9vSBUZXh0IOexu+Wei+eahOe7k+eCuVxyXG5mdW5jdGlvbiBtb3VudFRleHROb2RlKHZub2RlLCBjb250YWluZXIsIGFuY2hvcikge1xyXG4gICAgY29uc3QgdGV4dE5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh2bm9kZS5jaGlsZHJlbik7XHJcbiAgICAvLyBjb250YWluZXIuYXBwZW5kQ2hpbGQodGV4dE5vZGUpO1xyXG4gICAgY29udGFpbmVyLmluc2VydEJlZm9yZSh0ZXh0Tm9kZSwgYW5jaG9yKTtcclxuICAgIHZub2RlLmVsID0gdGV4dE5vZGU7XHJcbn1cclxuXHJcbi8vIOWIm+W7uuaMgui9vSBFbGVtZW50IOexu+Wei+eahOe7k+eCuVxyXG5mdW5jdGlvbiBtb3VudEVsZW1lbnQodm5vZGUsIGNvbnRhaW5lciwgYW5jaG9yKSB7XHJcbiAgICBjb25zdCB7XHJcbiAgICAgICAgdHlwZSxcclxuICAgICAgICBwcm9wcyxcclxuICAgICAgICBzaGFwZUZsYWcsXHJcbiAgICAgICAgY2hpbGRyZW5cclxuICAgIH0gPSB2bm9kZTtcclxuICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlKTtcclxuICAgIHBhdGNoUHJvcHMobnVsbCwgcHJvcHMsIGVsKTtcclxuXHJcbiAgICAvLyDliJvlu7rmjILovb0gY2hpbGRyZW4g57uT54K5XHJcbiAgICBpZiAoc2hhcGVGbGFnICYgU2hhcGVGbGFncy5URVhUX0NISUxEUkVOKSB7XHJcbiAgICAgICAgbW91bnRUZXh0Tm9kZSh2bm9kZSwgZWwpO1xyXG4gICAgfSBlbHNlIGlmIChzaGFwZUZsYWcgJiBTaGFwZUZsYWdzLkFSUkFZX0NISUxEUkVOKSB7XHJcbiAgICAgICAgbW91bnRDaGlsZHJlbihjaGlsZHJlbiwgZWwpO1xyXG4gICAgfVxyXG4gICAgLy8gY29udGFpbmVyLmFwcGVuZENoaWxkKGVsKTsgIOi/meS5n+WGmeWQjue7rSBmcmFnbWVudCDmm7TmlrDmnInlrZDnu5Pngrnml7bvvIzkvJrnm7TmjqXmj5LlhaXliLAgY29udGFpbmVyIOWwvumDqO+8jOWvvOiHtOmhuuW6j+mUmeS5sVxyXG4gICAgY29udGFpbmVyLmluc2VydEJlZm9yZShlbCwgYW5jaG9yKTtcclxuICAgIHZub2RlLmVsID0gZWw7XHJcbn1cclxuXHJcbi8vIOW9kyBjaGlsZHJlbiDkuLrmlbDnu4TnsbvlnovvvIwgY2hpbGRyZW4g5oyC6L295aSE55CGXHJcbmZ1bmN0aW9uIG1vdW50Q2hpbGRyZW4oY2hpbGRyZW4sIGNvbnRhaW5lciwgYW5jaG9yKSB7XHJcbiAgICBjaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xyXG4gICAgICAgIC8vIG1vdW50KGNoaWxkLCBjb250YWluZXIpO1xyXG4gICAgICAgIC8vIOaUueaIkOeUqCBwYXRjaCAgbjEg5pivIG51bGws5Zug5Li65piv5paw5Yib5bu655qE77yM5rKh5pyJ5pen57uT54K5XHJcbiAgICAgICAgcGF0Y2gobnVsbCwgY2hpbGQsIGNvbnRhaW5lciwgYW5jaG9yKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vLyDmm7TmlrAgRWxlbWVudCDnsbvlnovnu5PngrlcclxuZnVuY3Rpb24gcGF0Y2hFbGVtZW50KG4xLCBuMikge1xyXG4gICAgbjIuZWwgPSBuMS5lbDtcclxuICAgIC8vIOi3nyBtb3VudEVsZW1lbnQg55u45a+55bqUXHJcbiAgICAvLyDlhYjmr5TovoMgcHJvcHNcclxuICAgIHBhdGNoUHJvcHMobjEucHJvcHMsIG4yLnByb3BzLCBuMi5lbCk7XHJcblxyXG4gICAgLy8g5YaN5q+U6L6DIGNoaWxkcmVuXHJcbiAgICBwYXRjaENoaWxkcmVuKG4xLCBuMiwgbjIuZWwpO1xyXG59XHJcblxyXG4vLyDmm7TmlrDlrZDnu5PngrnvvIwg5pyJIDkg56eN5oOF5Ya15Yik5patXHJcbmZ1bmN0aW9uIHBhdGNoQ2hpbGRyZW4objEsIG4yLCBjb250YWluZXIsIGFuY2hvcikge1xyXG4gICAgY29uc3Qge1xyXG4gICAgICAgIHNoYXBlRmxhZzogcHJldlNoYXBlRmxhZyxcclxuICAgICAgICBjaGlsZHJlbjogYzFcclxuICAgIH0gPSBuMTtcclxuICAgIGNvbnN0IHtcclxuICAgICAgICBzaGFwZUZsYWcsXHJcbiAgICAgICAgY2hpbGRyZW46IGMyXHJcbiAgICB9ID0gbjI7XHJcblxyXG4gICAgLy8g5b2TIG4yIOS4uiBUZXh0IOexu+Wei++8jOWvueW6lCBuMSDkuInnp43nsbvlnovliIbliKvmnInkuI3lkIznmoTmm7TmlrDmlrnms5VcclxuICAgIGlmIChzaGFwZUZsYWcgJiBTaGFwZUZsYWdzLlRFWFRfQ0hJTERSRU4pIHtcclxuICAgICAgICAvLyDph43lpI3mk43kvZzov5vooYzlkIjlubbvvIzkuIDlvIDlp4vlupTor6XmnIkgMyDkuKrliIbmlK/nmoRcclxuICAgICAgICBpZiAocHJldlNoYXBlRmxhZyAmIFNoYXBlRmxhZ3MuQVJSQVlfQ0hJTERSRU4pIHtcclxuICAgICAgICAgICAgdW5tb3VudENoaWxkcmVuKGMxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjMSAhPT0gYzIpIHtcclxuICAgICAgICAgICAgY29udGFpbmVyLnRleHRDb250ZW50ID0gYzI7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChzaGFwZUZsYWcgJiBTaGFwZUZsYWdzLkFSUkFZX0NISUxEUkVOKSB7XHJcbiAgICAgICAgLy8g5b2TIG4yIOS4uiBBcnJheSDnsbvlnovvvIzlr7nlupQgbjEg5LiJ56eN57G75Z6L5YiG5Yir5pyJ5LiN5ZCM55qE5pu05paw5pa55rOVXHJcbiAgICAgICAgaWYgKHByZXZTaGFwZUZsYWcgJiBzaGFwZUZsYWcuVEVYVF9DSElMRFJFTikge1xyXG4gICAgICAgICAgICBjb250YWluZXIudGV4dENvbnRlbnQgPSAnJztcclxuICAgICAgICAgICAgbW91bnRDaGlsZHJlbihjMiwgY29udGFpbmVyLCBhbmNob3IpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocHJldlNoYXBlRmxhZyAmIFNoYXBlRmxhZ3MuQVJSQVlfQ0hJTERSRU4pIHtcclxuICAgICAgICAgICAgLy8g566A5Y2V55qE6K6k5Li677yM5Y+q6KaB56ys5LiA5Liq5YWD57Sg5pyJIGtlee+8jOmCo+S5iOWtkOiKgueCueaVsOe7hOmHjOavj+S4quWFg+e0oOmDveaciSBrZXlcclxuICAgICAgICAgICAgaWYgKGMxWzBdICYmIGMxWzBdLmtleSAhPSBudWxsICYmIGMyWzBdICYmIGMyWzBdLmtleSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBwYXRjaEtleWVkQ2hpbGRyZW4oYzEsIGMyLCBjb250YWluZXIsIGFuY2hvcik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBwYXRjaFVua2V5ZWRDaGlsZHJlbihjMSwgYzIsIGNvbnRhaW5lciwgYW5jaG9yKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG1vdW50Q2hpbGRyZW4oYzIsIGNvbnRhaW5lciwgYW5jaG9yKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyDlvZMgbjIg5Li6IG51bGzvvIzlr7nlupQgbjEg5LiJ56eN57G75Z6L5YiG5Yir5pyJ5LiN5ZCM55qE5pu05paw5pa55rOV77yM5b2TIG4xIG4yIOmDveS4uiBudWxsICDkuI3nlKjlgZrku7vkvZXlpITnkIZcclxuICAgICAgICBpZiAocHJldlNoYXBlRmxhZyAmIHNoYXBlRmxhZy5URVhUX0NISUxEUkVOKSB7XHJcbiAgICAgICAgICAgIGNvbnRhaW5lci50ZXh0Q29udGVudCA9ICcnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocHJldlNoYXBlRmxhZyAmIFNoYXBlRmxhZ3MuQVJSQVlfQ0hJTERSRU4pIHtcclxuICAgICAgICAgICAgdW5tb3VudENoaWxkcmVuKGMxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG4vLyDlvZPlrZDoioLngrnkuLrmlbDnu4Tml7Ys5LiU5rKh5pyJIGtleSDml7bvvIzmm7TmlrDlrZDnu5PngrlcclxuLy8g5qC45b+DIGRpZmYg566X5rOVIOino+WGsyBjMTogYSBiIGMgICBjMjogeCBhIGIgYyBcclxuLy8g5Zyo5rKh5pyJIGtleSDnmoTmg4XlhrXkuIvvvIzmmK/mioogYSDmlLnkuLogeCwg6aG65L2N5pS55LiL5Y6777yM5pyA5ZCO5Yqg5LiKIGNcclxuLy8g5Zyo5pyJIGtleSDnmoTmg4XlhrXkuIvvvIzmmK/nm7TmjqXlnKggYSDliY3pnaLliqDkuIogeFxyXG5mdW5jdGlvbiBwYXRjaFVua2V5ZWRDaGlsZHJlbihjMSwgYzIsIGNvbnRhaW5lciwgYW5jaG9yKSB7XHJcbiAgICBjb25zdCBvbGRMZW5ndGggPSBjMS5sZW5ndGg7XHJcbiAgICBjb25zdCBuZXdMZW5ndGggPSBjMi5sZW5ndGg7XHJcbiAgICBjb25zdCBjb21tb25MZW5ndGggPSBNYXRoLm1pbihvbGRMZW5ndGgsIG5ld0xlbmd0aCk7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21tb25MZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHBhdGNoKGMxW2ldLCBjMltpXSwgY29udGFpbmVyLCBhbmNob3IpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvbGRMZW5ndGggPiBuZXdMZW5ndGgpIHtcclxuICAgICAgICB1bm1vdW50Q2hpbGRyZW4oYzEuc2xpY2UoY29tbW9uTGVuZ3RoKSk7XHJcbiAgICB9IGVsc2UgaWYgKG9sZExlbmd0aCA8IG5ld0xlbmd0aCkge1xyXG4gICAgICAgIG1vdW50Q2hpbGRyZW4oYzIuc2xpY2UoY29tbW9uTGVuZ3RoKSwgY29udGFpbmVyLCBhbmNob3IpO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuLy8gbWF4TmV3SW5kZXhTb0ZhciDkvovlrZDvvJpcclxuLy8gYSBiIGMgIC0+ICBhIGMgYlxyXG4vLyDov5nkuKrmmK8gcmVhY3Qg5qC45b+DIGRpZmYg566X5rOVLOaciee8uumZt+W9kyBhIGIgYyAtPiBjIGEgYiAs6L+Z5LiqIGRpZmYg566X5rOV6ZyA6KaB56e75Yqo5Lik5qyhLCBjIOS4jeWKqCwgYSBiIOmDveimgeenu+WKqFxyXG4vLyDmm7Tlpb3nmoTnrpfms5Xlhbblrp7lj6rpnIDopoHnp7vliqjkuIDmrKEgIOenu+WKqCBjIOWNs+WPrywgcmVhY3QgZGlmZueul+azleaYr+avlOi+g+WOn+Wni+eugOWNleeahCzmiYDku6XmgKfog73kuIrkuZ/kvJrlt67kuIDngrlcclxuZnVuY3Rpb24gcGF0Y2hLZXllZENoaWxkcmVuMihjMSwgYzIsIGNvbnRhaW5lciwgYW5jaG9yKSB7XHJcbiAgICAvLyDnlKjmoIflv5fmnaXliKTmlq3mmK/lkKbpnIDopoHnp7vliqjvvIzlpoLmnpzmmK/kuIDnm7TpgJLlop7vvIzliJnkuI3nlKjnp7vliqjvvIzlvZPmnInkuIvpmY3ml7bmiY3pnIDnp7vliqhcclxuICAgIGxldCBtYXhOZXdJbmRleFNvRmFyID0gMDtcclxuXHJcbiAgICBjb25zdCBtYXAgPSBuZXcgTWFwKCk7XHJcbiAgICAvLyDkvJjljJbvvJrmioogYzEg5a2Y5Zyo5ZOI5biMbWFw6YeMIFxyXG4gICAgLy8ga2V5IOaYr+e7k+eCueeahCBrZXkg5bGe5oCn77yMdmFsdWUg5piv5a+56LGh77yM6YeM6Z2i5pS+IOe7k+eCueWSjOmBjeWOhuaXtueahOS4i+aghyhqKe+8jOS7peWkh+WQjumdouWIpOaWreaYr+WQpumcgOimgeenu+WKqOS9jee9rlxyXG4gICAgYzEuZm9yRWFjaCgocHJldiwgaikgPT4ge1xyXG4gICAgICAgIG1hcC5zZXQocHJldi5rZXksIHtcclxuICAgICAgICAgICAgcHJldixcclxuICAgICAgICAgICAgalxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG5cclxuICAgIC8vIGMyIOS4reavj+S4que7k+eCueWvueeFpyBjMSDkuK3mnInmsqHmnInvvIzmnInnmoTor53lsLHov5vooYwgcGF0Y2gg5pu05paw77yM54S25ZCO5o+S5YWl5Yiw5ZCI6YCC55qE5L2N572uXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGMyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgbmV4dCA9IGMyW2ldO1xyXG4gICAgICAgIGNvbnN0IGN1ckFuY2hvciA9IGkgPT09IDAgPyBjMVswXS5lbCA6IGMyW2kgLSAxXS5lbC5uZXh0U2libGluZzsgLy8gaSA9PSAwIOivtOaYjuaYryBjMiDnmoTnrKzkuIDkuKrnu5Pngrk7IOaJvuS4jeWIsOaXtizpgqPkuYjnm7TmjqXmj5LlhaXliLAgYzEg55qE5LiA5byA5aeLOyDmib7lvpfliLDml7YsYzEuZWwg6LefIGMyLmVs55u45ZCMOyDlj43kuYvnmoTmmK/ku47kuK3pl7Tmj5LlhaVcclxuICAgICAgICBpZiAobWFwLmhhcyhuZXh0LmtleSkpIHtcclxuICAgICAgICAgICAgY29uc3Qge1xyXG4gICAgICAgICAgICAgICAgcHJldixcclxuICAgICAgICAgICAgICAgIGpcclxuICAgICAgICAgICAgfSA9IG1hcC5nZXQobmV4dC5rZXkpO1xyXG4gICAgICAgICAgICBwYXRjaChwcmV2LCBuZXh0LCBjb250YWluZXIsIGFuY2hvcik7XHJcblxyXG4gICAgICAgICAgICBpZiAoaiA8IG1heE5ld0luZGV4U29GYXIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5pbnNlcnRCZWZvcmUobmV4dC5lbCwgY3VyQW5jaG9yKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG1heE5ld0luZGV4U29GYXIgPSBqO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG1hcC5kZWxldGUobmV4dC5rZXkpOyAvLyDmib7liLDkuoblsLHlnKggbWFwIOS4reWIoOaOiSzmnIDlkI7liankuIvnmoTlsLHmmK8gYzEg5Lit5pyJIGMyIOS4reayoeacieeahOe7k+eCuSzpgY3ljobmiorov5nkupvnu5Pngrnljbjovb3mjonlsLHooYxcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyDmib7kuI3liLDlsLHmj5LlhaXmlrDnu5PngrlcclxuICAgICAgICAgICAgcGF0Y2gobnVsbCwgbmV4dCwgY29udGFpbmVyLCBjdXJBbmNob3IpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyDljbjovb3mjokgbWFwIOS4reWJqeS9meeahOe7k+eCuVxyXG4gICAgbWFwLmZvckVhY2goKHtcclxuICAgICAgICBwcmV2XHJcbiAgICB9KSA9PiB7XHJcbiAgICAgICAgdW5tb3VudChwcmV2KTtcclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG4vLyB2dWUg55qE5qC45b+DIGRpZmYg566X5rOVICjliKnnlKjlhazlhbHmnIDplb/kuIrljYflrZDluo/liJfnrpfms5UpXHJcbmZ1bmN0aW9uIHBhdGNoS2V5ZWRDaGlsZHJlbihjMSwgYzIsIGNvbnRhaW5lciwgYW5jaG9yKSB7XHJcbiAgICBsZXQgaSA9IDA7XHJcbiAgICBsZXQgZTEgPSBjMS5sZW5ndGggLSAxO1xyXG4gICAgbGV0IGUyID0gYzIubGVuZ3RoIC0gMjtcclxuXHJcbiAgICAvLyAxLuS7juW3puiHs+WPs+S+neasoeWvueavlFxyXG4gICAgd2hpbGUgKGkgPD0gZTEgJiYgaSA8PSBlMiAmJiBjMVtpXS5rZXkgPT09IGMyW2ldLmtleSkge1xyXG4gICAgICAgIHBhdGNoKGMxW2ldLCBjMltpXSwgY29udGFpbmVyLCBhbmNob3IpO1xyXG4gICAgICAgIGkrKztcclxuICAgIH1cclxuXHJcbiAgICAvLyAyLuS7juWPs+iHs+W3puS+neasoeWvueavlFxyXG4gICAgd2hpbGUgKGkgPD0gZTEgJiYgaSA8PSBlMiAmJiBjMVtlMV0ua2V5ID09PSBjMltlMl0ua2V5KSB7XHJcbiAgICAgICAgcGF0Y2goYzFbZTFdLCBjMltlMl0sIGNvbnRhaW5lciwgYW5jaG9yKTtcclxuICAgICAgICBlMS0tO1xyXG4gICAgICAgIGUyLS07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gMy4g5b2TIGkgPiBlMSDnmoTml7blgJnvvIzor7TmmI7ml6fnu5Pngrnlt7Lnu4/mr5Tlr7nlrozvvIzliankuIvnmoTmlrDnu5Pngrnnm7TmjqUgbW91bnQsIOS+i+WtkO+8miDml6fvvJogYSBiIGMgICDmlrDvvJogYSBkIGIgYyAg6KaB5aKe5YqgIGQg57uT54K5XHJcbiAgICBpZiAoaSA+IGUxKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaiA9IGk7IGogPD0gZTI7IGorKykge1xyXG4gICAgICAgICAgICBjb25zdCBuZXh0UG9zID0gZTIgKyAxO1xyXG4gICAgICAgICAgICBjb25zdCBjdXJBbmNob3IgPSAoYzJbbmV4dFBvc10gJiYgYzJbbmV4dFBvc10uZWwpIHx8IGFuY2hvcjsgLy8g6YG/5YWNIGUyIOaYr+acgOWQjuS4gOS4qu+8jOmCo+Wug+eahOS4i+S4gOS4quWwseaYr+epuu+8jOmCo+WFtuWunuWwseaYr+ebtOaOpeeUqCBhbmNob3Is5oqK5a6D5pS+5YiwIGNvbnRhaW5lciDnmoTmnIDlkI5cclxuICAgICAgICAgICAgcGF0Y2gobnVsbCwgYzJbal0sIGNvbnRhaW5lciwgY3VyQW5jaG9yKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKGkgPiBlMikge1xyXG4gICAgICAgIC8vIDQuIOW9kyBpID4gZTIg77yM6K+05piO5paw57uT54K55bey57uP5q+U5a+55a6M77yM5Ymp5LiL55qE5pen57uT54K555u05o6lIHVubW91bnQg5Y246L2977yM5L6L5a2Q77yaIOaXpzogYSBiIGQgYyAgIOaWsO+8miAgYSBiIGMgICDpgqPkuYjopoHmiorml6fnmoQgZCDliKDmjolcclxuICAgICAgICBmb3IgKGxldCBqID0gaTsgaiA8PSBlMTsgaisrKSB7XHJcbiAgICAgICAgICAgIHVubW91bnQoYzFbal0pO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gNS4g5Ymp5LiL55qE5oOF5Ya15bCx5piv77ya5bem5Y+z5q+U5a+55a6M77yM5Lit6Ze05piv5Lmx5bqP55qEIGkg5pei5LiN5aSn5LqOIGUxIO+8jOS5n+S4jeWkp+S6jiBlMlxyXG4gICAgICAgIC8vIOWBmuazle+8mumHh+eUqOS8oOe7n+eahCBkaWZmIOeul+azle+8jOS9huS4jeecn+eahOa3u+WKoOWSjOenu+WKqO+8jOWPquWBmuagh+iusOWSjOWIoOmZpFxyXG5cclxuICAgICAgICAvLyDkuIvpnaLnmoTku6PnoIHmmK/moLnmja4gcGF0Y2hLZXllZENoaWxkcmVuMiDmlLnpgKDnmoTvvIzms6jph4rlnKggcGF0Y2hLZXllZENoaWxkcmVuMiDkuK3nnItcclxuICAgICAgICBsZXQgbWF4TmV3SW5kZXhTb0ZhciA9IDA7XHJcblxyXG4gICAgICAgIGNvbnN0IG1hcCA9IG5ldyBNYXAoKTsgICAvLyBtYXAg6K6w5b2V5pen57uT54K55L+h5oGvXHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yKGxldCBqID0gaTtqIDw9IGVsO2orKykge1xyXG4gICAgICAgICAgICBjb25zdCBwcmV2ID0gYzFbal07XHJcbiAgICAgICAgICAgIG1hcC5zZXQocHJldi5rZXksIHsgcHJldiwgaiB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IG5ldyBBcnJheShlMiAtIGkgKyAxKS5maWxsKC0xKTsgIC8vIHNvdXJjZSDorrDlvZXkuK3pl7TkubHluo/pg6jliIYg5paw57uT54K55ZyoIOaXp+e7k+eCueaVsOe7hOS4reeahOS4i+agh1xyXG4gICAgICAgIGxldCBtb3ZlID0gZmFsc2U7ICAgIC8vIOWIpOaWreaYr+WQpuecn+eahOmcgOimgeenu+WKqCDlj6rmnInlvZMgaiA8IG1heE5ld0luZGV4U29GYXIg5LiL5qCH5byA5aeL5LiL6ZmN55qE5pe25YCZ5omN6ZyA6KaB56e75YqoXHJcbiAgICAgICAgY29uc3QgdG9Nb3VudGVkID0gW107ICAgICAvLyDnibnkvovvvJrlvZPmlrDnu5PngrnmlbDnu4Tpg73mmK/ljYfluo/nmoTvvIzkvYbmmK/kuK3pl7TmnInnu5PngrnpnIDopoHmj5LlhaXvvIznlLHkuo7pg73mmK/ljYfluo/vvIzmiYDku6UgbW92ZSA9IGZhbHNlLOS4jeS8mui/m+WFpeWIsO+8jOWQjumdoueahOacgOmVv+S4iuWNh+WtkOW6j+WIl+eul+azleS4rVxyXG4gICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgc291cmNlLmxlbmd0aDsgaysrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5leHQgPSBjMltrICsgaV07XHJcbiAgICAgICAgICAgIGlmIChtYXAuaGFzKG5leHQua2V5KSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeyBwcmV2LGogfSA9IG1hcC5nZXQobmV4dC5rZXkpO1xyXG4gICAgICAgICAgICAgICAgcGF0Y2gocHJldiwgbmV4dCwgY29udGFpbmVyLCBhbmNob3IpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGogPCBtYXhOZXdJbmRleFNvRmFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbW92ZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG1heE5ld0luZGV4U29GYXIgPSBqO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc291cmNlW2tdID0gajtcclxuICAgICAgICAgICAgICAgIG1hcC5kZWxldGUobmV4dC5rZXkpOyBcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIOWkhOeQhueJueS+iyDkvovlrZA6IOaXp++8miBhIGIgYyAgIOaWsO+8miBhIHggYiB5IGMgIOmCo+S5iCBtb3ZlIOS4gOebtOmDveS4uiBmYWxzZSwgeCB5IOacgOWQjumDveayoeacuuS8mua3u+WKoOi/m+WOu++8jOaJgOS7peaKiuimgea3u+WKoOeahOe7k+eCueS/neWtmOWcqOS4gOS4quaVsOe7hOmHjFxyXG4gICAgICAgICAgICAgICAgdG9Nb3VudGVkLnB1c2goayArIGkpOyAgIC8vIOaKiuimgea3u+WKoOeahOe7k+eCueeahOS9jee9ruS4i+agh+S/neWtmOi1t+adpe+8jOWQjumdouWGjee7n+S4gCBtb3VudCDmt7vliqBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIG1hcC5mb3JFYWNoKCh7IHByZXYgfSkgPT4ge1xyXG4gICAgICAgICAgICB1bm1vdW50KHByZXYpO1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGlmKG1vdmUpIHtcclxuICAgICAgICAgICAgLy8gNS7pnIDopoHnp7vliqjvvIzliJnph4fnlKjmlrDnmoTmnIDplb/kuIrljYflrZDluo/liJfnrpfms5VcclxuICAgICAgICAgICAgY29uc3Qgc2VxID0gZ2V0U2VxdWVuY2UoKTsgLy8g6L+U5Zue5YC85Li677ya5omA5pyJ5LiN6ZyA6KaB5Yqo55qE57uT54K555qE5LiL5qCHXHJcbiAgICAgICAgICAgIGxldCBqID0gc2VxLmxlbmd0aCAtIDE7XHJcblxyXG4gICAgICAgICAgICAvLyDku47lkI7lvoDliY3nnItcclxuICAgICAgICAgICAgZm9yKGxldCBrID0gc291cmNlLmxlbmd0aCAtIDE7IGsgPj0gMDtrLS0pIHsgXHJcbiAgICAgICAgICAgICAgICBpZiAoc2VxW2pdID09IGspIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyDkuI3nlKjnp7vliqhcclxuICAgICAgICAgICAgICAgICAgICBqLS07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBvcyA9IGsgKyBpOyAgIC8vIOW9k+WJjee7k+eCueeahOS9jee9ru+8jOimgeWKoOS4iiBp77yM5Zug5Li6IHNvdXJjZSDlj6rmmK/kuK3pl7TkubHluo/nmoTpg6jliIZcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0UG9zID0gayArIDE7ICAvLyDkuIvkuIDkuKrnu5PngrnnmoTkvY3nva7vvIzlm6DkuLropoHmj5LlhaXliLDkuIvkuIDkuKrnu5PngrnnmoTliY3pnaJcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJBbmNob3IgPSAoYzJbbmV4dFBvc10gJiYgYzJbbmV4dFBvc10uZWwpIHx8IGFuY2hvcjsgLy8g5aaC5p6c5LiL5LiA5Liq57uT54K55a2Y5Zyo6YKj5LmI5bCx5piv5LiL5Liq57uT54K555qEIGVsIO+8jOS4jeWtmOWcqOWwseebtOaOpeeUqCBhbmNob3Ig5o+S5YWl5Yiw5a655Zmo55qE5pyA5pyr5bC+XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoc291cmNlW2tdID09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOa3u+WKoO+8jOivtOaYjuaWsOe7k+eCueayoeacieaJvuWIsOWvueW6lOaXp+e7k+eCue+8jOaJgOS7peimgSBtb3VudCDmt7vliqDor6XmlrDnu5PngrlcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2gobnVsbCwgYzJbcG9zXSwgY29udGFpbmVyLCBjdXJBbmNob3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOenu+WKqFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuaW5zZXJ0QmVmb3JlKGMyW3Bvc10uZWwsIGN1ckFuY2hvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICh0b01vdW50ZWQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIC8vIDYuIOeJueauiuaDheWGte+8muS4jemcgOimgeenu+WKqO+8jOS9hui/mOacieacqua3u+WKoOeahOWFg+e0oFxyXG4gICAgICAgICAgICAvLyDlpITnkIbnibnkvoss5oqK5Lit6Ze06KaB5re75Yqg55qE57uT54K577yMbW91bnQg5re75Yqg6LW35p2lXHJcbiAgICAgICAgICAgIGZvciAobGV0IGsgPSB0b01vdW50ZWQubGVuZ3RoIC0gMTsgayA+PSAwO2stLSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcG9zID0gdG9Nb3VudGVkW2tdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dFBvcyA9IHBvcyArIDE7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJBbmNob3IgPSAoYzJbbmV4dFBvc10gJiYgYzJbbmV4dFBvc10uZWwpIHx8IGFuY2hvcjtcclxuICAgICAgICAgICAgICAgIC8vIG1vdW50IOa3u+WKoFxyXG4gICAgICAgICAgICAgICAgcGF0Y2gobnVsbCwgYzJbcG9zXSwgY29udGFpbmVyLCBjdXJBbmNob3IpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vLyDlipvmiaPpopjnm67vvJrmnIDplb/pgJLlop7lrZDluo/liJdcclxuZnVuY3Rpb24gZ2V0U2VxdWVuY2UobnVtcykge1xyXG4gICAgY29uc3QgYXJyID0gW251bXNbMF1dO1xyXG4gICAgY29uc3QgcG9zaXRpb24gPSBbMF07ICAgLy8gcG9zaXRpb24g6K6w5b2V5q+P5Liq5YWD57Sg5ZyoIGFyciDkuK3lh7rnjrDnmoTkvY3nva5cclxuICAgIC8vIOS7juWQjuW+gOWJjeaJvuesrOS4gOS4qumAkuWHj+eahOS9jee9ru+8jOWwseaYr+WtkOW6j+WIl+eahOWAvOeahOS4i+aghyAgXHJcbiAgICAvLyBwb3NpdGlvbjogWyAwLCAwLCAwLCAxLCAxLCAyLCAzLCAzXSDku47lkI7lvoDliY3mib7nrKzkuIDkuKogMyDnrKzkuIDkuKogMiAuLi4g5a+55bqU55qE5LiL5qCH5bCx5piv5a2Q5bqP5YiX5YWD57Sg5LiL5qCHXHJcblxyXG4gICAgZm9yKGxldCBpID0gMTtpIDwgbnVtcy5sZW5ndGg7aSsrKSB7XHJcbiAgICAgICAgaWYobnVtc1tpXSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgY29udGludWU7ICAgICAgLy8g6K+05piO5piv6KaBIG1vdW50IOa3u+WKoOeahOe7k+eCuVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihudW1zW2ldID4gYXJyW2Fyci5sZW5ndGggLSAxXSkge1xyXG4gICAgICAgICAgICBhcnIucHVzaChudW1zW2ldKTtcclxuICAgICAgICAgICAgcG9zaXRpb24ucHVzaChhcnIubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IGwgPSAwLHIgPSBhcnIubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgd2hpbGUobCA8PSByKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWlkID0gTWF0aC5mbG9vcigobCArIHIpIC8gMik7XHJcbiAgICAgICAgICAgICAgICBpZihhcnJbbWlkXSA8IG51bXNbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBsID0gbWlkICsgMTtcclxuICAgICAgICAgICAgICAgIH1lbHNlIGlmKGFyclttaWRdID4gbnVtc1tpXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgciA9IG1pZCAtIDE7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbCA9IG1pZDtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhcnJbbF0gPSBudW1zW2ldO1xyXG4gICAgICAgICAgICBwb3NpdGlvbi5wdXNoKGwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBsZXQgY3VyID0gcG9zaXRpb24ubGVuZ3RoO1xyXG4gICAgZm9yKGxldCBpID0gcG9zaXRpb24ubGVuZ3RoIC0gMTtpID49IDAgJiYgY3VyID4gLTE7aS0tKSB7XHJcbiAgICAgICAgaWYocG9zaXRpb25baV0gPT0gY3VyKSB7XHJcbiAgICAgICAgICAgIGFycltjdXJdID0gbnVtc1tpXTtcclxuICAgICAgICAgICAgY3VyLS07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gYXJyOyAgICAvLyDov5Tlm57lrZDluo/liJfnnJ/lrp7lgLxcclxufTtcclxuIiwiY29uc3QgcXVldWUgPSBbXTsgIC8vIOS7u+WKoemYn+WIl1xyXG5sZXQgaXNGbHVzaGluZyA9IGZhbHNlOyAgLy8g5Yik5pat5piv5ZCm5q2j5Zyo5omn6KGMXHJcbmNvbnN0IHJlc29sdmVkUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpOyAgICAvLyDmlrDlu7ogUHJvbWlzZVxyXG5sZXQgY3VycmVudEZsdXNoUHJvbWlzZTsgICAvLyDorrDlvZXku7vliqHpmJ/liJflhajpg6jlgZrlrozov5Tlm57nmoQgUHJvbWlzZVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XHJcbiAgICBjb25zdCBwID0gY3VycmVudEZsdXNoUHJvbWlzZSB8fCByZXNvbHZlZFByb21pc2U7ICAgLy8g5b2T5YmN5Lu75Yqh5pyJ5Zyo5omn6KGM5pe277yM6L+U5Zue5omn6KGM5ZCO55qEIFByb21pc2UsIOayoeacieaXtui/lOWbnuaWsOW7uueahFxyXG4gICAgcmV0dXJuIGZuID8gcC50aGVuKGZuKSA6IHA7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBxdWV1ZUpvYiAoam9iKSB7XHJcbiAgICBpZighcXVldWUubGVuZ3RoIHx8ICFxdWV1ZS5pbmNsdWRlcyhqb2IpKSB7ICAgLy8g55u45ZCM55qE5Lu75Yqh5Y+q6ZyA6KaB6L+b5YWlIDEg5Liq5bCx6KGMXHJcbiAgICAgICAgcXVldWUucHVzaChqb2IpO1xyXG4gICAgICAgIHF1ZXVlRmx1c2goKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8g5bCG6Zif5YiX5Lu75Yqh6K6+572u5Li6IOW+ruS7u+WKoSDlvILmraXmiafooYxcclxuZnVuY3Rpb24gcXVldWVGbHVzaCgpIHtcclxuICAgIGlmKCFpc0ZsdXNoaW5nKSB7XHJcbiAgICAgICAgaXNGbHVzaGluZyA9IHRydWU7XHJcbiAgICAgICAgY3VycmVudEZsdXNoUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZmx1c2hKb2JzKVxyXG4gICAgfVxyXG59XHJcblxyXG4vLyDmiafooYzku7vliqHvvIzmuIXnqbrpmJ/liJdcclxuZnVuY3Rpb24gZmx1c2hKb2JzKCkge1xyXG4gICAgdHJ5IHsgICAvLyDmnInkupvmmK/nlKjmiLfmk43kvZzvvIzmiYDku6XnlKggdHJ5IFxyXG4gICAgICAgIGZvcihsZXQgaSA9IDA7aSA8IHF1ZXVlLmxlbmd0aDtpKyspIHtcclxuICAgICAgICAgICAgY29uc3Qgam9iID0gcXVldWVbaV07XHJcbiAgICAgICAgICAgIGpvYigpOyAgICAgLy8g5omn6KGMIGpvYlxyXG4gICAgICAgIH1cclxuICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgaXNGbHVzaGluZyA9IGZhbHNlO1xyXG4gICAgICAgIHF1ZXVlLmxlbmd0aCA9IDA7IC8vIOa4heepuumYn+WIl1xyXG4gICAgICAgIGN1cnJlbnRGbHVzaFByb21pc2UgPSBudWxsO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHtcclxuICAgIGlzQXJyYXksXHJcbiAgICBpc051bWJlcixcclxuICAgIGlzT2JqZWN0LFxyXG4gICAgaXNTdHJpbmdcclxufSBmcm9tIFwiLi4vdXRpbHNcIjtcclxuXHJcbi8vIOeUqOS6juWIpOaWree7k+eCueexu+WeiyAo5Y+q5YaZ5LqG5Li76KaB55qE5Zub56eN57G75Z6LOiBkb23lhYPntKDvvIznuq/mlofmnKzvvIxGcmFnbWVudO+8jOe7hOS7tilcclxuZXhwb3J0IGNvbnN0IFNoYXBlRmxhZ3MgPSB7XHJcbiAgICBFTEVNRU5UOiAxLFxyXG4gICAgVEVYVDogMSA8PCAxLFxyXG4gICAgRlJBR01FTlQ6IDEgPDwgMixcclxuICAgIENPTVBPTkVOVDogMSA8PCAzLFxyXG4gICAgVEVYVF9DSElMRFJFTjogMSA8PCA0LFxyXG4gICAgQVJSQVlfQ0hJTERSRU46IDEgPDwgNSxcclxuICAgIENISUxEUkVOOiAoMSA8PCA0KSB8ICgxIDw8IDUpXHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgVGV4dCA9IFN5bWJvbCgnVGV4dCcpO1xyXG5leHBvcnQgY29uc3QgRnJhZ21lbnQgPSBTeW1ib2woJ0ZyYWdtZW50Jyk7XHJcblxyXG4vKipcclxuICogXHJcbiAqIEBwYXJhbSB7c3RyaW5nIHwgT2JqZWN0IHwgVGV4dCB8IEZyYWdtZW50fSB0eXBlIFxyXG4gKiBAcGFyYW0ge09iamVjdCB8IG51bGx9IHByb3BzIFxyXG4gKiBAcGFyYW0ge3N0cmluZyB8IG51bWJlciB8IEFycmF5IHwgbnVsbH0gY2hpbGRyZW4gXHJcbiAqIEByZXR1cm5zIFZOb2RlXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaCh0eXBlLCBwcm9wcywgY2hpbGRyZW4pIHtcclxuICAgIGxldCBzaGFwZUZsYWcgPSAwO1xyXG4gICAgaWYgKGlzU3RyaW5nKHR5cGUpKSB7XHJcbiAgICAgICAgc2hhcGVGbGFnID0gU2hhcGVGbGFncy5FTEVNRU5UO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBUZXh0KSB7XHJcbiAgICAgICAgc2hhcGVGbGFnID0gU2hhcGVGbGFncy5URVhUO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBGcmFnbWVudCkge1xyXG4gICAgICAgIHNoYXBlRmxhZyA9IFNoYXBlRmxhZ3MuRlJBR01FTlQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNoYXBlRmxhZyA9IFNoYXBlRmxhZ3MuQ09NUE9ORU5UO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpc1N0cmluZyhjaGlsZHJlbikgfHwgaXNOdW1iZXIoY2hpbGRyZW4pKSB7XHJcbiAgICAgICAgc2hhcGVGbGFnIHw9IFNoYXBlRmxhZ3MuVEVYVF9DSElMRFJFTjtcclxuICAgICAgICBjaGlsZHJlbiAtIGNoaWxkcmVuLnRvU3RyaW5nKCk7XHJcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkoY2hpbGRyZW4pKSB7XHJcbiAgICAgICAgc2hhcGVGbGFnIHw9IFNoYXBlRmxhZ3MuQVJSQVlfQ0hJTERSRU47XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0eXBlLFxyXG4gICAgICAgIHByb3BzLFxyXG4gICAgICAgIGNoaWxkcmVuLFxyXG4gICAgICAgIHNoYXBlRmxhZyxcclxuICAgICAgICBlbDogbnVsbCwgICAgIC8vIOaMh+WQkSB2bm9kZSDnmoTnnJ/lrp7nmoQgZG9tIOe7k+eCuVxyXG4gICAgICAgIGFuY2hvcjogbnVsbCwgICAvLyDkuLogZnJhZ21lbnQg5pu05paw5pe25o+S5YWl77yM5LiN5Lya5o+S5YWl5Yiw5pyr5bC+77yM6K6+572u5LiA5Liq5qCH6K+G5LuO5Lit6Ze05o+S5YWlXHJcbiAgICAgICAga2V5OiBwcm9wcyAmJiBwcm9wcy5rZXksICAgICAvLyDnlKjmnaXmm7Tnm7Top4LnroDljZXnmoTliKTmlq3kuKTkuKrnu5PngrnmmK/lkKbkuLrlkIzkuIDkuKrnu5PngrnvvIjnm7jnrYnvvIlcclxuICAgICAgICBjb21wb25lbnQ6IG51bGwgICAgIC8vIOS4k+mXqOeUqOS6juWtmOWCqOe7hOS7tueahOWunuS+i1xyXG4gICAgfTtcclxufVxyXG5cclxuLy8g6Ziy5q2iIHJlbmRlciDov5Tlm57lgLzkuI3mmK8gdm5vZGUg5Ye66ZSZ77yM5Yik5pat5ZCE56eN57G75Z6L6L+U5Zue5YC86L+b6KGM5aSE55CG77yM5L2/5b6X5LiA5a6a6L+U5ZueIHZub2RlIOe7k+eCuVxyXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplVm5vZGUocmVzdWx0KSB7XHJcbiAgICBpZihpc0FycmF5KHJlc3VsdCkpIHtcclxuICAgICAgICByZXR1cm4gaChGcmFnbWVudCwgbnVsbCwgcmVzdWx0KTtcclxuICAgIH1cclxuICAgIGlmKGlzT2JqZWN0KHJlc3VsdCkpIHtcclxuICAgICAgICAvLyDor7TmmI7lt7Lnu4/mmK8gdm5vZGUg57uT54K55LqGXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8g5Ymp5LiL55qE5Y+q6IO95pivIHN0cmluZyBudW1iZXJcclxuICAgIHJldHVybiBoKFRleHQsIG51bGwsIHJlc3VsdC50b1N0cmluZygpKTtcclxufSIsIi8vIOW3peWFt+exu+WIpOaWreaYr+WQpuS4uuWvueixoeexu+Wei1xyXG5leHBvcnQgZnVuY3Rpb24gaXNPYmplY3QodGFyZ2V0KSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIHRhcmdldCA9PT0gJ29iamVjdCcgJiYgdGFyZ2V0ICE9PSBudWxsO1xyXG59XHJcblxyXG4vLyDliKTmlq3mmK/lkKbkuLrmlbDnu4RcclxuZXhwb3J0IGZ1bmN0aW9uIGlzQXJyYXkodGFyZ2V0KSB7XHJcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheSh0YXJnZXQpO1xyXG59XHJcblxyXG4vLyDliKTmlq3mmK/lkKbkuLrlh73mlbBcclxuZXhwb3J0IGZ1bmN0aW9uIGlzRnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIHRhcmdldCA9PT0gJ2Z1bmN0aW9uJztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzU3RyaW5nKHRhcmdldCkge1xyXG4gICAgcmV0dXJuIHR5cGVvZiB0YXJnZXQgPT09ICdzdHJpbmcnO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNOdW1iZXIodGFyZ2V0KSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIHRhcmdldCA9PT0gJ251bWJlcic7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0Jvb2xlYW4odGFyZ2V0KSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIHRhcmdldCA9PT0gJ2Jvb2xlYW4nO1xyXG59XHJcblxyXG4vLyDliKTmlq3lgLzmmK/lkKblj5HnlJ/mlLnlj5hcclxuZXhwb3J0IGZ1bmN0aW9uIGhhc0NoYW5nZWQob2xkVmFsdWUsIHZhbHVlKSB7XHJcbiAgICByZXR1cm4gb2xkVmFsdWUgIT09IHZhbHVlICYmICEoTnVtYmVyLmlzTmFOKG9sZFZhbHVlKSAmJiBOdW1iZXIuaXNOYU4odmFsdWUpKTsgIC8vIOaWsOiAgeWAvOS4jeebuOetie+8jOS4lOS4pOS4quWAvOmDveS4jeiDveS4uiBOYU4g5Zug5Li6IE5hTiAhPT0gTmFOIOaJgOS7peS4gOWumuaUvuWbnueahOaYr+aUueWPmFxyXG59XHJcblxyXG4vLyDmiorlrZfnrKbkuLLovazmjaLkuLrpqbzls7DlvaLlvI9cclxuLy8gbXktbmFtZSAtPiBteU5hbWVcclxuZXhwb3J0IGZ1bmN0aW9uIGNhbWVsaXplKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8tKFxcdykvZywgKF8sIGMpID0+ICggYyA/IGMudG9VcHBlckNhc2UoKSA6ICcnKSk7XHJcbn1cclxuXHJcbi8vIOmmluWtl+avjeWkp+WGmVxyXG5leHBvcnQgZnVuY3Rpb24gY2FwaXRhbGl6ZShzdHIpIHtcclxuICAgIHJldHVybiBzdHJbMF0udG9VcHBlckNhc2UoKSArIHN0ci5zbGljZSgxKTtcclxufSIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IHsgY29tcGlsZSB9IGZyb20gJy4vY29tcGlsZXIvY29tcGlsZSc7XHJcbmltcG9ydCB7XHJcbiAgY3JlYXRlQXBwLFxyXG4gIHJlbmRlcixcclxuICBoLFxyXG4gIFRleHQsXHJcbiAgRnJhZ21lbnQsXHJcbiAgbmV4dFRpY2ssXHJcbiAgcmVuZGVyTGlzdCxcclxufSBmcm9tICcuL3J1bnRpbWUnO1xyXG5pbXBvcnQgeyByZWFjdGl2ZSwgcmVmLCBjb21wdXRlZCwgZWZmZWN0IH0gZnJvbSAnLi9yZWFjdGl2aXR5JztcclxuXHJcbmV4cG9ydCBjb25zdCBNaW5pVnVlID0gKHdpbmRvdy5NaW5pVnVlID0ge1xyXG4gIGNyZWF0ZUFwcCxcclxuICByZW5kZXIsXHJcbiAgaCxcclxuICBUZXh0LFxyXG4gIEZyYWdtZW50LFxyXG4gIG5leHRUaWNrLFxyXG4gIHJlYWN0aXZlLFxyXG4gIHJlZixcclxuICBjb21wdXRlZCxcclxuICBlZmZlY3QsXHJcbiAgY29tcGlsZSxcclxuICByZW5kZXJMaXN0XHJcbn0pO1xyXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=