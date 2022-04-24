export enum IOEvent {
  TrackStart = 'track:start',
  TrackEnd = 'track:end',
  TrackTimeChange = 'track:time-change',
  TrackSeek = 'track:seek',
  TrackPause = 'track:pause',
  TrackResume = 'track:resume',
  NoteOn = 'note:on',
  NoteOff = 'note:off',
  MidiFileLoaded = 'midi:file-loaded',
  MidiFileEnd = 'midi:file-end',
  MapNotes = 'map-notes',
}
