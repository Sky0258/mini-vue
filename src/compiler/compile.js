import { parse } from "./parse";
import { generate } from "./codegen";

export function compile(template) {
    const ast = parse(template);
    console.log(ast,'ast');
    return generate(ast);
}