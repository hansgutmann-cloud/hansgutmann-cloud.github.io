// Node-side adapter for testing the unmodified browser worker's message protocol.
import {parentPort} from 'node:worker_threads';
globalThis.self={postMessage:message=>parentPort.postMessage(message)};
await import('../assets/js/worker.js');
parentPort.on('message',data=>self.onmessage({data}));
parentPort.postMessage({ready:true});
