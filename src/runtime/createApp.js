import { h, render } from '.'
import { isString } from "../utils"

export function createApp(rootComponent) {
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