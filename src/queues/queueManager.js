import mailQueue from './mailQueue.js'

// A single Redis connection is shared by the producer, the processor and the
// BullBoard adapter instead of opening one queue per consumer.
export { mailQueue }
export default { mailQueue }
