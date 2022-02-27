import SerialPort from "serialport";
import { io, Socket } from "socket.io-client";
import {
  pinMappings as defaultPinMappings,
  parsePinMappings,
} from "./pinMappings";
import { log } from "./logger";
const {
  SERVER_URL,
  LOG_MESSAGES,
  PORT_ADDRESS = "/dev/ttyUSB0",
  BAUD_RATE = "256000",
  DIMMABLE_RANGE = "",
  DIMMABLE_DOWN_RANGE = "",
  DEVICE_NAME,
} = process.env;

const port = new SerialPort(PORT_ADDRESS, { baudRate: parseInt(BAUD_RATE) });

let pinMappings = defaultPinMappings;

port.on("open", () => {
  startUp();
});

port.on("data", (data) => {
  console.log("Data:", data.toString("utf8"));
});

const minLevel = 85;
const maxLevel = 35;
const maxVelocity = 127;

const thresholdRange = maxVelocity / (minLevel - maxLevel);
const dimmableNotes = DIMMABLE_RANGE.split(",");
const dimmableDownNotes = DIMMABLE_DOWN_RANGE.split(",");

const velocityCache: { [note: string]: number } = {};

function startUp() {
  log(`Pins initialized:`, pinMappings);

  setTimeout(() => {
    toggleAllPins("on");
  }, 500);

  let socket: Socket;
  if (!SERVER_URL) {
    throw new Error("SERVER_URL must be configured");
  } else {
    socket = io(SERVER_URL);
  }

  listenForNoteMessages(socket);
}

function convertToBinary(pinValues: number[]) {
  return pinValues
    .reduce((t, v) => t + Math.pow(2, v - 1), 0)
    .toString()
    .padStart(3, "0");
}

function getSum(pinValues: number[]) {
  return pinValues
    .reduce((t, v) => t + v, 0)
    .toString()
    .padStart(3, "0");
}

function toggleAllPins(mode: "on" | "off") {
  if (!pinMappings) {
    throw new Error("No pins mapped. Please configure NOTE_PIN_MAPPINGS.");
  }

  const pinBits = getSum([...new Set(Object.values(pinMappings))]);

  const endLevel = mode === "on" ? maxLevel : minLevel;
  const startLevel = mode === "on" ? minLevel : maxLevel;
  const payload = `${pinBits}${startLevel}${endLevel}00`;

  port.write(`${payload}\n`);
}

function togglePin(pin: number, mode: "on" | "off") {}

function listenForNoteMessages(socket: Socket) {
  socket
    .on("map-notes", (deviceName, mappings) => {
      if (deviceName === DEVICE_NAME) {
        pinMappings = parsePinMappings(mappings);
      }
    })
    .on("song-start", () => toggleAllPins("off"))
    .on("note-on", (note, velocity, length, sameNotes, autoOff = 1) => {
      const notes = [note];
      if (sameNotes?.length) {
        notes.push(...sameNotes);
      }

      const pins = notes.map((n) => pinMappings[n]).filter((p) => p);

      if (!pins.length || !velocity) {
        return;
      }

      const binaryPins = getSum(pins);
      if (isNaN(parseInt(binaryPins))) {
        console.log(notes, pins);
        return;
      }

      let startLevel = minLevel;
      let endLevel = maxLevel;

      if (dimmableDownNotes.includes(note)) {
        startLevel = maxLevel;
        endLevel = minLevel;
      }

      const payload = `${binaryPins}${startLevel}${endLevel}${autoOff}${
        length || 0
      }`;
      port.write(`${payload}\n`);
    })
    .on("note-off", (note) => {
      const pin = pinMappings[note];

      if (!pin || dimmableNotes.includes(note)) {
        return;
      }

      const payload = `${getSum([pin])}${maxLevel}${minLevel}00`;

      port.write(`${payload}\n`);
    })
    .on("midi:file-end", () => {
      setTimeout(() => toggleAllPins("on"), 100);
      pinMappings = defaultPinMappings;
    })
    .on("song-end", () => {
      setTimeout(() => toggleAllPins("on"), 100);
      pinMappings = defaultPinMappings;
    });

  if (LOG_MESSAGES === "true") {
    socket.onAny((...args) => {
      log(args);
    });
  }
}
