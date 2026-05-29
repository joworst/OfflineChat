import { encrypt, decrypt } from './cryptoService';

const MESSAGE_TYPES = {
  TEXT: 'm',
  TYPING: 't',
  TYPING_STOP: 's',
  READ_RECEIPT: 'r',
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function wrapMessage(type, data, messageId) {
  return JSON.stringify({
    t: type,
    d: data,
    i: messageId || generateId(),
    ts: new Date().toISOString(),
  });
}

function unwrapMessage(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return { t: MESSAGE_TYPES.TEXT, d: raw, i: null, ts: null };
  }
}

export function createTextPayload(text, messageId) {
  return wrapMessage(MESSAGE_TYPES.TEXT, text, messageId);
}

export function createTypingPayload() {
  return wrapMessage(MESSAGE_TYPES.TYPING, '');
}

export function createTypingStopPayload() {
  return wrapMessage(MESSAGE_TYPES.TYPING_STOP, '');
}

export function createReadReceiptPayload(messageId) {
  return wrapMessage(MESSAGE_TYPES.READ_RECEIPT, messageId);
}

export { MESSAGE_TYPES, unwrapMessage, generateId };

export async function sendWithRetry(sendFn, payload, maxRetries) {
  const attempts = maxRetries || MAX_RETRIES;
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      await sendFn(payload);
      return true;
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (i + 1)));
      }
    }
  }
  throw lastError;
}

export class MessageQueue {
  constructor(sendFn) {
    this.queue = [];
    this.processing = false;
    this.sendFn = sendFn;
  }

  enqueue(payload) {
    this.queue.push(payload);
    if (!this.processing) {
      this.process();
    }
  }

  async process() {
    this.processing = true;
    while (this.queue.length > 0) {
      const payload = this.queue.shift();
      try {
        await sendWithRetry(this.sendFn, payload, MAX_RETRIES);
      } catch (error) {
        console.log('Message send failed after retries:', error);
      }
    }
    this.processing = false;
  }

  clear() {
    this.queue = [];
    this.processing = false;
  }
}
