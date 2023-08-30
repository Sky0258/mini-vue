const queue = [];  // 任务队列
let isFlushing = false;  // 判断是否正在执行
const resolvedPromise = Promise.resolve();    // 新建 Promise
let currentFlushPromise;   // 记录任务队列全部做完返回的 Promise

export function nextTick(fn) {
    const p = currentFlushPromise || resolvedPromise;   // 当前任务有在执行时，返回执行后的 Promise, 没有时返回新建的
    return fn ? p.then(fn) : p;
}

export function queueJob (job) {
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