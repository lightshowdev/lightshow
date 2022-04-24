import * as React from 'react';

import { Stack, Typography, Slider } from '@mui/material';
import { useIOPlayerEvents } from '../hooks/useIOPlayerEvents';

import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import FastForwardIcon from '@mui/icons-material/FastForward';

interface PlaySliderProps {
  onChange: (
    event: Event,
    { action, value }: { action: 'seek'; value: number }
  ) => void;
}

export const PlaySlider: React.FC<PlaySliderProps> = ({ onChange }) => {
  const sliderRef = React.useRef<HTMLSpanElement | null>(null);
  const timeRef = React.useRef<HTMLSpanElement | null>(null);
  const durationRef = React.useRef<HTMLSpanElement | null>(null);
  const {
    values: { time, duration, percentage },
    handleSeek,
  } = useIOPlayerEvents({
    sliderRef,
    timeRef,
    durationRef,
  });

  const [seekPercentage, setSeekPercentage] = React.useState(percentage);
  const [seekChangePercentage, setSeekChangePercentage] = React.useState<
    number | null
  >(null);

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    setSeekChangePercentage(newValue as number);
  };

  const handleSliderChangeCommitted = (
    event: Event,
    newValue: number | number[]
  ) => {
    handleSeek(newValue as number, duration);
    setTimeout(() => setSeekChangePercentage(null), 1000);
  };

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
        <PlayCircleFilledIcon />
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
        />
        <Typography ref={durationRef} />
      </Stack>
    </Stack>
  );
};
