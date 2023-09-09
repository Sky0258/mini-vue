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
            const { h, Text, Fragment } = MiniVue;
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
                return createElementVNode(node);
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
                        removedWhitespaces = true;
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
            if(attr.type === _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.DIRECTIVE) {
                directives.push(attr);
            } else {
                props.push(attr);
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
                dirName = 'bind',
                argContent = name.slice(1);   // 去除掉 : 之后的都是指令名
            } else if (name[0] === '@') {
                dirName = 'on',
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
            let index = context.source.indexOf(endTokens[i]);
            if(index < endIndex) {
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
            const { template } = Component;
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
                (0,___WEBPACK_IMPORTED_MODULE_0__.render)((0,___WEBPACK_IMPORTED_MODULE_0__.h)(rootComponent), rootContainer);
            }
        }
    
        return app;
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
    /* harmony export */   render: () => (/* reexport safe */ _render__WEBPACK_IMPORTED_MODULE_1__.render)
    /* harmony export */ });
    /* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");
    /* harmony import */ var _render__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./render */ "./src/runtime/render.js");
    /* harmony import */ var _scheduler__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./scheduler */ "./src/runtime/scheduler.js");
    /* harmony import */ var _createApp__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./createApp */ "./src/runtime/createApp.js");
    
    
    
    
    
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
    });
    
    console.log(window);
    })();
    
    /******/ })()
    ;