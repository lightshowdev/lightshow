import * as React from 'react';

import { Stack, Typography, Slider, IconButton, Tooltip } from '@mui/material';
import { useIOPlayerEvents, getTimeString } from '../hooks/useIOPlayerEvents';

import type { Track } from '@lightshow/core';

import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import FastForwardIcon from '@mui/icons-material/FastForward';

interface PlayerControlProps {
  track?: Track;
  onChange?: (
    event: Event,
    { action, value }: { action: 'seek'; value: number }
  ) => void;
}

export const PlayerControls: React.FC<PlayerControlProps> = ({
  onChange,
  track,
}) => {
  const sliderRef = React.useRef<HTMLSpanElement | null>(null);
  const timeRef = React.useRef<HTMLSpanElement | null>(null);
  const durationRef = React.useRef<HTMLSpanElement | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const {
    values: { time, duration, percentage },
    handlers,
  } = useIOPlayerEvents({
    track,
    sliderRef,
    timeRef,
    durationRef,
    audioRef,
  });

  const [seekPercentage, setSeekPercentage] = React.useState(percentage);
  const [seekChangePercentage, setSeekChangePercentage] = React.useState<
    number | null
  >(null);

  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    setIsPlaying(false);
  }, [track]);

  const handleSliderChange = (_, newValue: number | number[]) => {
    setSeekChangePercentage(newValue as number);
  };

  const handleSliderChangeCommitted = (_, newValue: number | number[]) => {
    handlers.seek(newValue as number);
    setTimeout(() => setSeekChangePercentage(null), 1000);
  };

  const handlePlayPauseClick = () => {
    if (isPlaying) {
      handlers.pause();
    } else {
      handlers.resume();
    }
  };

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('playing', () => {
        setIsPlaying(true);
      });
      audioRef.current.addEventListener('pause', () => {
        setIsPlaying(false);
      });
    }
  }, [audioRef]);

  React.useEffect(() => {
    if (typeof seekChangePercentage === 'number') {
      setSeekPercentage(seekChangePercentage);
      return;
    }

    setSeekPercentage(percentage);
  }, [percentage, seekChangePercentage]);

  return (
    <Stack direction="column" sx={{ p: 2 }}>
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={2}
        sx={{ p: 2 }}
      >
        <FastRewindIcon />
        <IconButton onClick={handlePlayPauseClick}>
          {!isPlaying ? <PlayCircleFilledIcon /> : <PauseCircleFilledIcon />}
        </IconButton>
        <FastForwardIcon />
      </Stack>
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={2}
      >
        <Typography ref={timeRef} />
        <Slider
          value={seekPercentage}
          ref={sliderRef}
          onChange={handleSliderChange}
          onChangeCommitted={handleSliderChangeCommitted}
          aria-label="Time"
          valueLabelDisplay={seekChangePercentage ? 'on' : 'off'}
          valueLabelFormat={(v) => getTimeString(duration * (v / 100))}
          components={{
            ValueLabel: ValueLabelComponent,
          }}
        />
        <Typography ref={durationRef} />
      </Stack>
      <audio
        ref={audioRef}
        // src={track && `/api/playlist/${track.name}/download`}
        src={track && `/audio/${track.file}.wav`}
      />
    </Stack>
  );
};

const ValueLabelComponent: React.FC<{ value: number }> = ({
  children,
  value,
}) => {
  return (
    <Tooltip enterTouchDelay={0} placement="top" title={value}>
      {children as React.ReactElement<any, any>}
    </Tooltip>
  );
};
