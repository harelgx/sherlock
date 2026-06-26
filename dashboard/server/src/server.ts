import Fastify from 'fastify';
import { WebSocketServer, WebSocket } from 'ws';
import { startEnrichedErrorConsumer } from './consumer.js';
import { EnrichedError } from '../../../shared/src/types.js';

const app = Fastify({ logger: false });

const wss = new WebSocketServer({ noServer: true });

const connections = new Set<WebSocket>();
const errorHistory: EnrichedError[] = [];

function sendErrorToSockets(error: EnrichedError): void {
  errorHistory.push(error);
  console.log(`[kafka] received enriched error — ${error.context.request.method} ${error.context.request.url} (${error.context.response?.statusCode ?? error.context.nodeError?.code}), broadcasting to ${connections.size} client(s)`);
  connections.forEach(socket => {
    socket.send(JSON.stringify(error))
  });
}

wss.on('connection', (socket) => {
  connections.add(socket);
  console.log(`[ws] client connected — ${connections.size} total, replaying ${errorHistory.length} history item(s)`);
  errorHistory.forEach(error => socket.send(JSON.stringify(error)));

  socket.on('close', () => {
    connections.delete(socket);
    console.log(`[ws] client disconnected — ${connections.size} remaining`);
  })
});

app.server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

app.get('/health', async () => ({ ok: true }));


const PORT = Number(process.env.PORT ?? 4000);

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error('[server] failed to start', err);
    process.exit(1);
  }

  console.log(`[server] listening on port ${PORT}`);
  startEnrichedErrorConsumer(async (context) => {
    sendErrorToSockets(context)
  })
});

export { wss };
