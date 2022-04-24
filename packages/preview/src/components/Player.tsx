import * as React from 'react';

import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material';

import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import FastForwardIcon from '@mui/icons-material/FastForward';
import type { Track } from '@lightshow/core';
import { PlaySlider } from './PlaySlider';

interface PlayerProps {
  tracks: Track[];
  activeTrack: Track;
  onPlayClick: (track: Track) => void;
}

export const Player: React.FC<PlayerProps> = ({
  tracks,
  activeTrack,
  onPlayClick,
}) => {
  const [togglePlayer, setTogglePlayer] = React.useState(false);

  const toggleDrawer =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event &&
        event.type === 'keydown' &&
        ((event as React.KeyboardEvent).key === 'Tab' ||
          (event as React.KeyboardEvent).key === 'Shift')
      ) {
        return;
      }

      setTogglePlayer(open);
    };

  const handleSliderChange = ({
    action = 'seek',
    time,
  }: {
    action: 'seek';
    time: number;
  }) => {
    onplay;
  };

  return (
    <>
      <Box sx={{ position: 'absolute', right: 40, top: 40 }}>
        <IconButton
          size="large"
          sx={{ color: 'white' }}
          aria-label="openplayer"
          onClick={() => setTogglePlayer(true)}
        >
          <PlayCircleOutlineIcon />
        </IconButton>
      </Box>
      <Drawer
        anchor="right"
        open={togglePlayer}
        onClose={() => setTogglePlayer(false)}
      >
        <Stack spacing={1} sx={{ width: 300, flex: 1 }}>
          <div>
            {tracks.map((track) => (
              <Stack
                key={track.file}
                spacing={1}
                direction="row"
                sx={{ padding: 2 }}
              >
                <IconButton onClick={() => onPlayClick(track)}>
                  {activeTrack?.file === track.file ? (
                    <PauseCircleOutlineIcon />
                  ) : (
                    <PlayCircleOutlineIcon />
                  )}
                </IconButton>
                <Typography variant="button">
                  {track.name} - {track.artist}
                </Typography>
              </Stack>
            ))}
          </div>
          <Stack
            spacing={1}
            justifyContent="flex-end"
            alignItems="stretch"
            sx={{ flex: 1 }}
          >
            <PlaySlider onChange={handleSliderChange} />
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
};
