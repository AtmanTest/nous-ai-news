import { NextRequest } from 'next/server';
import { addSSEClient, removeSSEClient, broadcastHeartbeat } from '@/lib/sse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // Add this client
      addSSEClient(controller);
      
      // Send initial connection message
      const initData = JSON.stringify({
        type: 'connected',
        timestamp: Date.now(),
      });
      controller.enqueue(new TextEncoder().encode(`data: ${initData}\n\n`));
      
      // Send periodic heartbeat
      const heartbeatInterval = setInterval(() => {
        try {
          broadcastHeartbeat();
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000); // 30 seconds
      
      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        removeSSEClient(controller);
      });
    },
    cancel() {
      // Stream cancelled
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}