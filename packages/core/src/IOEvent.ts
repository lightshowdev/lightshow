export enum IOEvent {
  TrackStart = 'track:start',
  TrackLoad = 'track:load',
  TrackEnd = 'track:end',
  TrackTimeChange = 'track:time-change',
  TrackSeek = 'track:seek',
  TrackStop = 'track:stop',
  TrackPause = 'track:pause',
  TrackPlay = 'track:play',
  TrackResume = 'track:resume',
  NoteOn = 'note:on',
  NoteOff = 'note:off',
  MidiFileLoaded = 'midi:file-loaded',
  MidiFileEnd = 'midi:file-end',
  MapNotes = 'notes:map',
  ClientRegister = 'client:register',
}
