import { reactive } from "./reactive/reactive";
import { effect } from "./reactive/effect";
import { ref } from "./reactive/ref";

let k = window.k = ref(1);

effect(() => {
    console.log('k is ', k.value);
})
