import { storesSelector } from 'app/inventory/selectors';
import store from 'app/store/store';

const MCP_PORT = 9130;
const MCP_URL = `ws://localhost:${MCP_PORT}`;
let socket: WebSocket | null = null;

function sendInventory() {
  const state = store.getState();
  const payload = {
    stores: storesSelector(state),
    currencies: state.inventory.currencies,
  };
  try {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  } catch (e) {
    console.error('MCP WebSocket failed to send inventory', e);
  }
}

function handleMessage(event: MessageEvent) {
  let message: any = null;
  try {
    message = JSON.parse(event.data);
  } catch {
    if (event.data === 'ping') {
      sendInventory();
      return;
    }
  }
  if (message && message.type === 'ping') {
    sendInventory();
  }
}

function connect() {
  socket = new WebSocket(MCP_URL);

  socket.onopen = () => console.log('MCP WebSocket connected');

  socket.onmessage = handleMessage;

  socket.onerror = (err) => {
    console.error('MCP WebSocket error', err);
    try {
      socket?.close();
    } catch {}
  };

  socket.onclose = () => {
    console.warn('MCP WebSocket closed, retrying in 3s');
    setTimeout(connect, 3000);
  };
}

export function startMcpSocket() {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    connect();
  }
}
