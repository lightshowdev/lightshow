import SerialPort from 'serialport';
import { io, Socket } from 'socket.io-client';

const { POWER_PINOUT } = process.env;

const {
  SERVER_URL = '127.0.0.1:3000',
  LOG_MESSAGES,
  PORT_ADDRESS = '/dev/ttyUSB0',
} = process.env;

const port = new SerialPort(PORT_ADDRESS, { baudRate: 256000 });
let powerPinMappings: { [channelName: string]: { on: number; off: number } };

port
  .on('open', () => startUp())
  .on('error', (err) => {
    console.log(err);
  });

function startUp() {
  if (!POWER_PINOUT) {
    console.log('POWER_PINOUT not configured. Skipping power controller load.');
    return;
  }

  powerPinMappings = Object.fromEntries(
    POWER_PINOUT.split(',').map((pinMapping) => {
      const [channelName, onPin, offPin] = pinMapping.split(':');
      return [channelName, { on: parseInt(onPin), off: parseInt(offPin) }];
    })
  );

  console.log(powerPinMappings);

  let socket: Socket;
  if (!SERVER_URL) {
    throw new Error('SERVER_URL must be configured');
  } else {
    socket = io(SERVER_URL);
  }

  listen(socket);
}

export function togglePower({
  channel,
  state,
  interval = 2000,
}: {
  channel: string;
  state: 'on' | 'off';
  interval?: number;
}) {
  const pin = powerPinMappings[channel][state];
  const payload = `${pin}1${interval}\n`;

  port.write(payload);
}

function listen(socket: Socket) {
  socket.on('power', (channel, state) => {});

  if (LOG_MESSAGES === 'true') {
    socket.onAny((...args) => {
      //
    });
  }
}
