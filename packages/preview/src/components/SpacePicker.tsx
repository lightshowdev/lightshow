import * as React from 'react';

import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material';

import LandscapeIcon from '@mui/icons-material/Landscape';

interface SpacePickerProps {
  spaces: any[];
  activeSpace: any;
  onLoadSpace: (space: any) => void;
}

export const SpacePicker: React.FC<SpacePickerProps> = ({
  spaces,
  activeSpace,
  onLoadSpace,
}) => {
  const [toggleSpacePicker, setToggleSpacePicker] = React.useState(false);

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

      setToggleSpacePicker(open);
    };

  return (
    <>
      <Box sx={{ position: 'absolute', right: 10, top: 30 }}>
        <IconButton
          size="large"
          sx={{ color: 'white' }}
          aria-label="openplayer"
          onClick={() => setToggleSpacePicker(true)}
        >
          <LandscapeIcon />
        </IconButton>
      </Box>
      <Drawer
        anchor="right"
        open={toggleSpacePicker}
        keepMounted={true}
        onClose={() => setToggleSpacePicker(false)}
      >
        <Stack sx={{ width: 300, flex: 1 }}>
          <Stack sx={{ py: 1 }} direction="column">
            {spaces.map((space) => (
              <Stack
                key={space.name}
                spacing={1}
                direction="row"
                alignItems="center"
                sx={{ px: 1 }}
              >
                <IconButton
                  disabled={activeSpace?.name === space.name}
                  onClick={() => onLoadSpace(space)}
                >
                  {activeSpace?.file === space.name ? (
                    <LandscapeIcon htmlColor="green" />
                  ) : (
                    <LandscapeIcon />
                  )}
                </IconButton>
                <Typography variant="subtitle2">{space.name}</Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
};
