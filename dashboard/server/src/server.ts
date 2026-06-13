import Fastify from 'fastify';
import { WebSocketServer, WebSocket } from 'ws';
import { startEnrichedErrorConsumer } from './consumer.js';
import { EnrichedError } from '../../../shared/src/types.js';

const app = Fastify({ logger: true });

const wss = new WebSocketServer({ noServer: true });

const connections = new Set<WebSocket>();
const errorHistory: EnrichedError[] = [];

function sendErrorToSockets(error: EnrichedError): void {
  errorHistory.push(error);
  connections.forEach(socket => {
    socket.send(JSON.stringify(error))
  });
}

wss.on('connection', (socket) => {
  connections.add(socket);
  errorHistory.forEach(error => socket.send(JSON.stringify(error)));

  socket.on('close', () => {
    connections.delete(socket);
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
    app.log.error(err);
    process.exit(1);
  }

  startEnrichedErrorConsumer(async (context) => {
    sendErrorToSockets(context)
  })
});

export { wss };
