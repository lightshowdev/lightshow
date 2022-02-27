import { io, Socket } from 'socket.io-client';
import rpio from 'rpio';
import {
  parsePinMappings,
  pinMappings as defaultPinMappings,
} from './pinMappings';
import { log } from './logger';

const { SERVER_URL, LOG_MESSAGES, DEVICE_NAME } = process.env;

let pinMappings = defaultPinMappings;

startUp();

function startUp() {
  let socket: Socket;

  initializePins();
  log(`Pins initialized:`, defaultPinMappings);
//  toggleAllPins('on');

  if (!SERVER_URL) {
    throw new Error('SERVER_URL must be configured');
  } else {
    socket = io(SERVER_URL);
  }

  listenForNoteMessages(socket);
}

function initializePins() {
  if (!defaultPinMappings) {
    throw new Error('No pins mapped. Please configure NOTE_PIN_MAPPINGS.');
  }
  Object.values(defaultPinMappings).forEach((p) => {
    rpio.open(p, rpio.OUTPUT);
  });
}

function toggleAllPins(mode: 'on' | 'off') {
  if (!defaultPinMappings) {
    throw new Error('No pins mapped. Please configure NOTE_PIN_MAPPINGS.');
  }
  Object.values(pinMappings).forEach((p) => {
    rpio.write(p, mode === 'on' ? rpio.HIGH : rpio.LOW);
  });
}

function togglePinByNote(note: string, mode: 'on' | 'off') {
  const pin = pinMappings[note];
  if (pin === undefined) {
    console.error(`Pin ${pin} is not mapped.`);
    return;
  }
  rpio.write(pin, mode === 'on' ? rpio.HIGH : rpio.LOW);
}

function listenForNoteMessages(socket: Socket) {
  socket
    .on('map-notes', (deviceName, mappings) => {
      if (deviceName === DEVICE_NAME) {
        pinMappings = parsePinMappings(mappings);
      }
    })
    .on('song-start', () => toggleAllPins('off'))
    .on('note-on', (note: string) => togglePinByNote(note, 'on'))
    .on('note-off', (note: string) => togglePinByNote(note, 'off'))
    .on('song-end', () => {
      toggleAllPins('on');
      // Reset to default pins
      pinMappings = defaultPinMappings;
    });

  if (LOG_MESSAGES === 'true') {
    socket.onAny((...args) => {
      log(args);
    });
  }
}
