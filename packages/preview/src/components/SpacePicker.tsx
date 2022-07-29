import * as React from 'react';

import {
  Box,
  Drawer,
  IconButton,
  Stack,
  Typography,
  Button,
} from '@mui/material';

import PublicIcon from '@mui/icons-material/Public';
import RestoreIcon from '@mui/icons-material/Restore';
import throttle from 'lodash.throttle';

interface SpacePickerProps {
  spaces: any[];
  activeSpace: any;
  onLoadSpace: (space: any) => void;
  visible?: boolean;
}

export const SpacePicker: React.FC<SpacePickerProps> = ({
  spaces,
  activeSpace,
  onLoadSpace,
  visible,
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

  const refreshSpace = throttle(() => {
    onLoadSpace(activeSpace);
  }, 500);

  const clearLocalSpaceConfig = () => {
    window.localStorage.removeItem(activeSpace.id);
    onLoadSpace(activeSpace);
  };

  React.useEffect(() => {
    window.addEventListener('resize', refreshSpace);

    return () => {
      window.removeEventListener('resize', refreshSpace);
    };
  });

  return (
    <>
      <Box sx={{ position: 'absolute', right: 10, top: 30 }}>
        <IconButton
          size="large"
          sx={{ color: visible ? 'white' : 'transparent' }}
          aria-label="openplayer"
          onClick={() => setToggleSpacePicker(true)}
        >
          <PublicIcon />
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
                spacing={0.5}
                direction="row"
                alignItems="center"
                sx={{ px: 1, width: '100%' }}
              >
                <IconButton
                  disabled={activeSpace?.name === space.name}
                  onClick={() => onLoadSpace(space)}
                >
                  {activeSpace?.name === space.name ? (
                    <PublicIcon htmlColor="green" />
                  ) : (
                    <PublicIcon />
                  )}
                </IconButton>
                <Typography variant="subtitle2">{space.name}</Typography>
                {activeSpace?.name === space.name && (
                  <Stack sx={{ marginLeft: 'auto !important', marginRight: 2 }}>
                    <Button
                      startIcon={<RestoreIcon />}
                      variant="text"
                      onClick={clearLocalSpaceConfig}
                      size="small"
                    >
                      Reset
                    </Button>
                  </Stack>
                )}
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
};
