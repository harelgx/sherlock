import Fastify from 'fastify';
import { WebSocketServer } from 'ws';

const app = Fastify({ logger: true });

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'connected' }));
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
});

export { wss };
