import { h, render } from '.'
import { camelize, capitalize, isString } from "../utils"

let components;
export function createApp(rootComponent) {
    components = rootComponent.components;
    const app = {
        mount(rootContainer) {
            if(isString(rootContainer)) {
                rootContainer = document.querySelector(rootContainer);
            }

            // 当没有 render 函数也没有 template 模板时，加载容器里面的内容为 template
            if(!rootComponent.render && !rootComponent.template) {
                rootComponent.template = rootContainer.innerHTML;
            }
            rootContainer.innerHTML = '';    // 要把原本的删掉，避免加载两次

            render(h(rootComponent), rootContainer);
        }
    }

    return app;
}

// 处理组件，组件名可以为 tree-item treeItem TreeItem
export function resolveComponent(name) {
    return (
        components && (components[name] || components[camelize(name)] || components[capitalize(camelize(name))])
    );
}