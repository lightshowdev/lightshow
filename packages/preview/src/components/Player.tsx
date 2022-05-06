import * as React from 'react';

import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material';

import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';

import type { Track } from '@lightshow/core';
import { PlayerControls } from './PlayerControls';

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

  return (
    <>
      <Box sx={{ position: 'absolute', right: 50, top: 30 }}>
        <IconButton
          size="large"
          sx={{ color: 'white' }}
          aria-label="openplayer"
          onClick={() => setTogglePlayer(true)}
        >
          <LibraryMusicIcon />
        </IconButton>
      </Box>
      <Drawer
        anchor="right"
        open={togglePlayer}
        keepMounted={true}
        onClose={() => setTogglePlayer(false)}
      >
        <Stack sx={{ width: 300, flex: 1 }}>
          <Stack sx={{ py: 1 }} direction="column">
            {tracks.map((track) => (
              <Stack
                key={track.file}
                spacing={1}
                direction="row"
                alignItems="center"
                sx={{ px: 1 }}
              >
                <IconButton
                  disabled={activeTrack?.file === track.file}
                  onClick={() => onPlayClick(track)}
                >
                  {activeTrack?.file === track.file ? (
                    <GraphicEqIcon htmlColor="green" />
                  ) : (
                    <PlayCircleOutlineIcon />
                  )}
                </IconButton>
                <Typography variant="subtitle2">
                  {track.name} / {track.artist}
                </Typography>
              </Stack>
            ))}
          </Stack>
          <Stack
            spacing={1}
            justifyContent="flex-end"
            alignItems="stretch"
            sx={{ flex: 1 }}
          >
            <PlayerControls track={activeTrack} />
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
};
