import buffer from 'node:buffer';

// Node.js 24+ / 26 removed SlowBuffer, which is referenced by legacy JWT/buffer dependencies
if (!buffer.SlowBuffer) {
  buffer.SlowBuffer = buffer.Buffer;
}
