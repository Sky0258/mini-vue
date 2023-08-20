import { reactive } from "./reactive/reactive";
import { effect } from "./reactive/effect";

// const count1 = (window.count1 = reactive(10));
// const count2 = (window.count2 = reactive(1));

const obs = (window.obs = reactive({
    count1: 10,
    count2: 1
}))

effect(() => {
    effect(() => {
        console.log('count2 : ' , obs.count2);
    })
    console.log('count1 :' , obs.count1);
})
