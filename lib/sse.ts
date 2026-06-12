// Live Updates (SSE) utilities
// Shared in-memory store for connected clients
// NOTE: In production with multiple instances, use Redis or similar

type SSEController = ReadableStreamDefaultController<Uint8Array>;

const clients = new Set<SSEController>();

export function addSSEClient(controller: SSEController) {
  clients.add(controller);
}

export function removeSSEClient(controller: SSEController) {
  clients.delete(controller);
}

export function broadcastNewArticles(count: number) {
  const data = JSON.stringify({
    type: 'new-articles',
    count,
    timestamp: Date.now(),
  });
  const message = `data: ${data}\n\n`;
  
  for (const controller of clients) {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch {
      // Client disconnected
      clients.delete(controller);
    }
  }
}

export function broadcastHeartbeat() {
  const data = JSON.stringify({
    type: 'heartbeat',
    timestamp: Date.now(),
  });
  const message = `data: ${data}\n\n`;
  
  for (const controller of clients) {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch {
      clients.delete(controller);
    }
  }
}