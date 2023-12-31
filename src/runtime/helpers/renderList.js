import { isArray, isNumber, isObject, isString } from "../../utils";

export function renderList(source, renderItem) {
    // v-for 指令中 items 可以有四种不同情况
    // item in items Array
    // item in obj  Object
    // item in 10   Number
    // item in 'abcede'   string

    const nodes = [];
    if(isNumber(source)) {
        for(let i = 0;i < source;i++) {
            nodes.push(renderItem(i + 1,i));
        }
    } else if(isString(source) || isArray(source)) {
        for(let i = 0;i < source.length;i++) {
            nodes.push(renderItem(source[i],i));
        }
    } else if(isObject(source)) {
        const keys = Object.keys(source);
        keys.forEach((key, index) => {
            nodes.push(renderItem(source[key], key, index));
        });
    }

    return nodes;
}