/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/runtime/index.js":
/*!******************************!*\
  !*** ./src/runtime/index.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Fragment: () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_0__.Fragment),
/* harmony export */   Text: () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_0__.Text),
/* harmony export */   h: () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_0__.h),
/* harmony export */   render: () => (/* reexport safe */ _render__WEBPACK_IMPORTED_MODULE_1__.render)
/* harmony export */ });
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");
/* harmony import */ var _render__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./render */ "./src/runtime/render.js");




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
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");



function render(vnode, container) {
    mount(vnode, container);
}

function mount(vnode, container) {
    const {
        shapeFlag
    } = vnode;
    if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.ELEMENT) {
        mountElement(vnode, container);
    } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.TEXT) {
        mountTextNode(vnode, container);
    } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.FRAGMENT) {
        mountFragment(vnode, container);
    } else {
        mountComponent(vnode, container);
    }
}

function mountElement(vnode, container) {
    const {
        type,
        props,
        children
    } = vnode;
    const el = document.createElement(type);
    mountProps(props, el);
    mountChildren(vnode, el);
    container.appendChild(children);
}

function mountTextNode(vnode, container) {
    const textNode = document.createTextNode(vnode.children);
    container.appendChild(textNode);
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
    if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.TEXT_CHILDREN) {
        mountTextNode(vnode, container);
    } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.ARRAY_CHILDREN) {
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
                    if(value === '' && (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isBoolean)(el[key])) {
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
/* harmony export */   h: () => (/* binding */ h)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");


// 用于判断结点类型 (只写了主要的四种类型)
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
    let ShapeFlag = 0;
    if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isString)(type)) {
        ShapeFlag = ShapeFlags.ELEMENT;
    } else if (type === Text) {
        ShapeFlag = ShapeFlags.TEXT;
    } else if (type === Fragment) {
        ShapeFlag = ShapeFlags.FRAGMENT;
    } else {
        ShapeFlag = ShapeFlags.COMPONENT;
    }

    if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isString)(children) || (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isNumber)(children)) {
        ShapeFlag |= ShapeFlags.TEXT_CHILDREN;
        children - children.toString();
    } else if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(children)) {
        ShapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    }

    return {
        type,
        props,
        children,
        ShapeFlag
    };
}

/***/ }),

/***/ "./src/utils/index.js":
/*!****************************!*\
  !*** ./src/utils/index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
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
/* harmony import */ var _runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./runtime */ "./src/runtime/index.js");


const vnode = (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)(
    'div',
    {
        class: 'a b',
        style: {
            border: '1px solid',
            fontSize: '14px',
        },
        onClick: () => console.log('click'),
        id: 'foo',
        checked: '',
        custom: false,
    },
    [
        (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)('ul',null, [
            (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)('li', { style: { color: 'red'}} , 1),
            (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)('li', null , 2),
            (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)('li', { style: { color: 'blue'}} , 3),
            (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)(_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, [(0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)('li', null, '4') , (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)('li')]),
            (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)('li', null ,[(0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)(_runtime__WEBPACK_IMPORTED_MODULE_0__.Text, null, 'hello world')]),
        ])
    ]
);

(0,_runtime__WEBPACK_IMPORTED_MODULE_0__.render)(vnode, document.body)
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaS12dWUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDREE7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDUEE7Ozs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL21pbmktdnVlMy8uL3NyYy9ydW50aW1lL2luZGV4LmpzIiwid2VicGFjazovL21pbmktdnVlMy8uL3NyYy9ydW50aW1lL3JlbmRlci5qcyIsIndlYnBhY2s6Ly9taW5pLXZ1ZTMvLi9zcmMvcnVudGltZS92bm9kZS5qcyIsIndlYnBhY2s6Ly9taW5pLXZ1ZTMvLi9zcmMvdXRpbHMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vbWluaS12dWUzL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL21pbmktdnVlMy93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vbWluaS12dWUzL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vbWluaS12dWUzL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vbWluaS12dWUzLy4vc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB7IGgsIFRleHQsIEZyYWdtZW50IH0gZnJvbSBcIi4vdm5vZGVcIlxyXG5cclxuZXhwb3J0IHsgcmVuZGVyIH0gZnJvbSAnLi9yZW5kZXInIiwiaW1wb3J0IHsgaXNCb29sZWFuIH0gZnJvbSBcIi4uL3V0aWxzXCI7XHJcbmltcG9ydCB7XHJcbiAgICBTaGFwZUZsYWdzXHJcbn0gZnJvbSBcIi4vdm5vZGVcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZW5kZXIodm5vZGUsIGNvbnRhaW5lcikge1xyXG4gICAgbW91bnQodm5vZGUsIGNvbnRhaW5lcik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vdW50KHZub2RlLCBjb250YWluZXIpIHtcclxuICAgIGNvbnN0IHtcclxuICAgICAgICBzaGFwZUZsYWdcclxuICAgIH0gPSB2bm9kZTtcclxuICAgIGlmIChzaGFwZUZsYWcgJiBTaGFwZUZsYWdzLkVMRU1FTlQpIHtcclxuICAgICAgICBtb3VudEVsZW1lbnQodm5vZGUsIGNvbnRhaW5lcik7XHJcbiAgICB9IGVsc2UgaWYgKHNoYXBlRmxhZyAmIFNoYXBlRmxhZ3MuVEVYVCkge1xyXG4gICAgICAgIG1vdW50VGV4dE5vZGUodm5vZGUsIGNvbnRhaW5lcik7XHJcbiAgICB9IGVsc2UgaWYgKHNoYXBlRmxhZyAmIFNoYXBlRmxhZ3MuRlJBR01FTlQpIHtcclxuICAgICAgICBtb3VudEZyYWdtZW50KHZub2RlLCBjb250YWluZXIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBtb3VudENvbXBvbmVudCh2bm9kZSwgY29udGFpbmVyKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbW91bnRFbGVtZW50KHZub2RlLCBjb250YWluZXIpIHtcclxuICAgIGNvbnN0IHtcclxuICAgICAgICB0eXBlLFxyXG4gICAgICAgIHByb3BzLFxyXG4gICAgICAgIGNoaWxkcmVuXHJcbiAgICB9ID0gdm5vZGU7XHJcbiAgICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodHlwZSk7XHJcbiAgICBtb3VudFByb3BzKHByb3BzLCBlbCk7XHJcbiAgICBtb3VudENoaWxkcmVuKHZub2RlLCBlbCk7XHJcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2hpbGRyZW4pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtb3VudFRleHROb2RlKHZub2RlLCBjb250YWluZXIpIHtcclxuICAgIGNvbnN0IHRleHROb2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodm5vZGUuY2hpbGRyZW4pO1xyXG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRleHROb2RlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbW91bnRGcmFnbWVudCh2bm9kZSwgY29udGFpbmVyKSB7XHJcbiAgICBtb3VudENoaWxkcmVuKHZub2RlLCBjb250YWluZXIpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtb3VudENvbXBvbmVudCh2bm9kZSwgY29udGFpbmVyKSB7fVxyXG5cclxuZnVuY3Rpb24gbW91bnRDaGlsZHJlbih2bm9kZSwgY29udGFpbmVyKSB7XHJcbiAgICBjb25zdCB7XHJcbiAgICAgICAgc2hhcGVGbGFnLFxyXG4gICAgICAgIGNoaWxkcmVuXHJcbiAgICB9ID0gdm5vZGU7XHJcbiAgICBpZiAoc2hhcGVGbGFnICYgU2hhcGVGbGFncy5URVhUX0NISUxEUkVOKSB7XHJcbiAgICAgICAgbW91bnRUZXh0Tm9kZSh2bm9kZSwgY29udGFpbmVyKTtcclxuICAgIH0gZWxzZSBpZiAoc2hhcGVGbGFnICYgU2hhcGVGbGFncy5BUlJBWV9DSElMRFJFTikge1xyXG4gICAgICAgIGNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB7XHJcbiAgICAgICAgICAgIG1vdW50KGNoaWxkLCBjb250YWluZXIpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKiAgcHJvcHMg5Y+C54WnXHJcbiAgICB7XHJcbiAgICAgICAgY2xhc3M6ICdidG4nLFxyXG4gICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgIGNvbG9yOiAncmVkJyxcclxuICAgICAgICAgICAgZm9udFNpemU6ICcxNHB4JyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uQ2xpY2s6ICgpID0+IGNvbnNvbGUubG9nKCdjbGljaycpLFxyXG4gICAgICAgIGNoZWNrZWQ6ICcnLFxyXG4gICAgICAgIGN1c3RvbTogZmFsc2VcclxuICAgIH1cclxuKi9cclxuLy8g5Yik5pat5piv55u05o6lIGVsLmtleSA9IHZhbHVlIOi/mOaYr+W+lyBlbC5zZXRBdHRyaWJ1dGUoa2V5LHZhbHVlKVxyXG5jb25zdCBkb21Qcm9wc1JFID0gL1tBLVpdIHwgXih2YWx1ZSB8IGNoZWNrZWQgfCBzZWxlY3RlZCB8IG11dGVkIHwgZGlzYWJsZWQpJC87XHJcbmZ1bmN0aW9uIG1vdW50UHJvcHMocHJvcHMsIGVsKSB7XHJcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBwcm9wcykge1xyXG4gICAgICAgIGxldCB2YWx1ZSA9IHByb3BzW2tleV07XHJcbiAgICAgICAgc3dpdGNoIChrZXkpIHtcclxuICAgICAgICAgICAgY2FzZSAnY2xhc3MnOlxyXG4gICAgICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnc3R5bGUnOlxyXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzdHlsZU5hbWUgaW4gdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbC5zdHlsZVtzdHlsZU5hbWVdID0gdmFsdWVbc3R5bGVOYW1lXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgaWYgKC9eb25bQS1aXS8udGVzdChrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXZlbnROYW1lID0ga2V5LnNsaWNlKDIpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5re75Yqg5LqL5Lu2XHJcbiAgICAgICAgICAgICAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZG9tUHJvcHNSRS50ZXN0KGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyDlvZPnlKjmiLflj6rlhpnkuoYgY2hlY2tlZCDml7bkvJrop6PmnpDmiJAgeydjaGVja2VkJyA6ICcnfSAo54m55L6LMSlcclxuICAgICAgICAgICAgICAgICAgICBpZih2YWx1ZSA9PT0gJycgJiYgaXNCb29sZWFuKGVsW2tleV0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyDlvZPoh6rlrprkuYnlsZ7mgKcgeyBjdXN0b20gOiBmYWxzZSB9LOino+aekOWQjiBmYWxzZSDkvJrlj5jmiJDlrZfnrKbkuLLvvIzmiYDku6XliKTmlq3lh7rmnaXov5jmmK8gdHJ1ZSAo54m55L6LMilcclxuICAgICAgICAgICAgICAgICAgICBpZih2YWx1ZSA9PSBudWxsIHx8IHZhbHVlID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoa2V5KTsgICAgICAgLy8g55u05o6l5oqK6K+l5bGe5oCn5LuO5YWD57Sg5LiK56e76ZmkXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCB7XHJcbiAgICBpc0FycmF5LFxyXG4gICAgaXNOdW1iZXIsXHJcbiAgICBpc1N0cmluZ1xyXG59IGZyb20gXCIuLi91dGlsc1wiO1xyXG5cclxuLy8g55So5LqO5Yik5pat57uT54K557G75Z6LICjlj6rlhpnkuobkuLvopoHnmoTlm5vnp43nsbvlnospXHJcbmV4cG9ydCBjb25zdCBTaGFwZUZsYWdzID0ge1xyXG4gICAgRUxFTUVOVDogMSxcclxuICAgIFRFWFQ6IDEgPDwgMSxcclxuICAgIEZSQUdNRU5UOiAxIDw8IDIsXHJcbiAgICBDT01QT05FTlQ6IDEgPDwgMyxcclxuICAgIFRFWFRfQ0hJTERSRU46IDEgPDwgNCxcclxuICAgIEFSUkFZX0NISUxEUkVOOiAxIDw8IDUsXHJcbiAgICBDSElMRFJFTjogKDEgPDwgNCkgfCAoMSA8PCA1KVxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IFRleHQgPSBTeW1ib2woJ1RleHQnKTtcclxuZXhwb3J0IGNvbnN0IEZyYWdtZW50ID0gU3ltYm9sKCdGcmFnbWVudCcpO1xyXG5cclxuLyoqXHJcbiAqIFxyXG4gKiBAcGFyYW0ge3N0cmluZyB8IE9iamVjdCB8IFRleHQgfCBGcmFnbWVudH0gdHlwZSBcclxuICogQHBhcmFtIHtPYmplY3QgfCBudWxsfSBwcm9wcyBcclxuICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXIgfCBBcnJheSB8IG51bGx9IGNoaWxkcmVuIFxyXG4gKiBAcmV0dXJucyBWTm9kZVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGgodHlwZSwgcHJvcHMsIGNoaWxkcmVuKSB7XHJcbiAgICBsZXQgU2hhcGVGbGFnID0gMDtcclxuICAgIGlmIChpc1N0cmluZyh0eXBlKSkge1xyXG4gICAgICAgIFNoYXBlRmxhZyA9IFNoYXBlRmxhZ3MuRUxFTUVOVDtcclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gVGV4dCkge1xyXG4gICAgICAgIFNoYXBlRmxhZyA9IFNoYXBlRmxhZ3MuVEVYVDtcclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gRnJhZ21lbnQpIHtcclxuICAgICAgICBTaGFwZUZsYWcgPSBTaGFwZUZsYWdzLkZSQUdNRU5UO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBTaGFwZUZsYWcgPSBTaGFwZUZsYWdzLkNPTVBPTkVOVDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXNTdHJpbmcoY2hpbGRyZW4pIHx8IGlzTnVtYmVyKGNoaWxkcmVuKSkge1xyXG4gICAgICAgIFNoYXBlRmxhZyB8PSBTaGFwZUZsYWdzLlRFWFRfQ0hJTERSRU47XHJcbiAgICAgICAgY2hpbGRyZW4gLSBjaGlsZHJlbi50b1N0cmluZygpO1xyXG4gICAgfSBlbHNlIGlmIChpc0FycmF5KGNoaWxkcmVuKSkge1xyXG4gICAgICAgIFNoYXBlRmxhZyB8PSBTaGFwZUZsYWdzLkFSUkFZX0NISUxEUkVOO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdHlwZSxcclxuICAgICAgICBwcm9wcyxcclxuICAgICAgICBjaGlsZHJlbixcclxuICAgICAgICBTaGFwZUZsYWdcclxuICAgIH07XHJcbn0iLCIvLyDlt6XlhbfnsbvliKTmlq3mmK/lkKbkuLrlr7nosaHnsbvlnotcclxuZXhwb3J0IGZ1bmN0aW9uIGlzT2JqZWN0KHRhcmdldCkge1xyXG4gICAgcmV0dXJuIHR5cGVvZiB0YXJnZXQgPT09ICdvYmplY3QnICYmIHRhcmdldCAhPT0gbnVsbDtcclxufVxyXG5cclxuLy8g5Yik5pat5piv5ZCm5Li65pWw57uEXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0FycmF5KHRhcmdldCkge1xyXG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodGFyZ2V0KTtcclxufVxyXG5cclxuLy8g5Yik5pat5piv5ZCm5Li65Ye95pWwXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0Z1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgcmV0dXJuIHR5cGVvZiB0YXJnZXQgPT09ICdmdW5jdGlvbic7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1N0cmluZyh0YXJnZXQpIHtcclxuICAgIHJldHVybiB0eXBlb2YgdGFyZ2V0ID09PSAnc3RyaW5nJztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzTnVtYmVyKHRhcmdldCkge1xyXG4gICAgcmV0dXJuIHR5cGVvZiB0YXJnZXQgPT09ICdudW1iZXInO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNCb29sZWFuKHRhcmdldCkge1xyXG4gICAgcmV0dXJuIHR5cGVvZiB0YXJnZXQgPT09ICdib29sZWFuJztcclxufVxyXG5cclxuLy8g5Yik5pat5YC85piv5ZCm5Y+R55Sf5pS55Y+YXHJcbmV4cG9ydCBmdW5jdGlvbiBoYXNDaGFuZ2VkKG9sZFZhbHVlLCB2YWx1ZSkge1xyXG4gICAgcmV0dXJuIG9sZFZhbHVlICE9PSB2YWx1ZSAmJiAhKE51bWJlci5pc05hTihvbGRWYWx1ZSkgJiYgTnVtYmVyLmlzTmFOKHZhbHVlKSk7ICAvLyDmlrDogIHlgLzkuI3nm7jnrYnvvIzkuJTkuKTkuKrlgLzpg73kuI3og73kuLogTmFOIOWboOS4uiBOYU4gIT09IE5hTiDmiYDku6XkuIDlrprmlL7lm57nmoTmmK/mlLnlj5hcclxufSIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IHsgcmVuZGVyLCBoLCBUZXh0LCBGcmFnbWVudCB9IGZyb20gXCIuL3J1bnRpbWVcIjtcclxuXHJcbmNvbnN0IHZub2RlID0gaChcclxuICAgICdkaXYnLFxyXG4gICAge1xyXG4gICAgICAgIGNsYXNzOiAnYSBiJyxcclxuICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQnLFxyXG4gICAgICAgICAgICBmb250U2l6ZTogJzE0cHgnLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25DbGljazogKCkgPT4gY29uc29sZS5sb2coJ2NsaWNrJyksXHJcbiAgICAgICAgaWQ6ICdmb28nLFxyXG4gICAgICAgIGNoZWNrZWQ6ICcnLFxyXG4gICAgICAgIGN1c3RvbTogZmFsc2UsXHJcbiAgICB9LFxyXG4gICAgW1xyXG4gICAgICAgIGgoJ3VsJyxudWxsLCBbXHJcbiAgICAgICAgICAgIGgoJ2xpJywgeyBzdHlsZTogeyBjb2xvcjogJ3JlZCd9fSAsIDEpLFxyXG4gICAgICAgICAgICBoKCdsaScsIG51bGwgLCAyKSxcclxuICAgICAgICAgICAgaCgnbGknLCB7IHN0eWxlOiB7IGNvbG9yOiAnYmx1ZSd9fSAsIDMpLFxyXG4gICAgICAgICAgICBoKEZyYWdtZW50LCBudWxsLCBbaCgnbGknLCBudWxsLCAnNCcpICwgaCgnbGknKV0pLFxyXG4gICAgICAgICAgICBoKCdsaScsIG51bGwgLFtoKFRleHQsIG51bGwsICdoZWxsbyB3b3JsZCcpXSksXHJcbiAgICAgICAgXSlcclxuICAgIF1cclxuKTtcclxuXHJcbnJlbmRlcih2bm9kZSwgZG9jdW1lbnQuYm9keSkiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=