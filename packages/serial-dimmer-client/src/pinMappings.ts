const { NOTE_PIN_MAPPINGS = '' } = process.env;

export const pinMappings = parsePinMappings(NOTE_PIN_MAPPINGS);

export function parsePinMappings(pinMap: string) {
  return pinMap.split(',').reduce((mappingObj, value) => {
    const [note, pin] = value.split(':').map((v) => v.trim());
    mappingObj[note] = parseInt(pin);
    return mappingObj;
  }, {} as { [note: string]: number });
}
