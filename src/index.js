import { reactive } from "./reactive/reactive";
import { effect } from "./reactive/effect";
import { ref } from "./reactive/ref";
import { computed } from "./reactive/computed";

let nums = window.nums = ref(12);

let k = window.k = computed({
    get() {
        console.log('get is change');
        return nums.value * 2;
    },
    set(newValue) {
        console.log('set change');
        nums.value = newValue;
    }
})
