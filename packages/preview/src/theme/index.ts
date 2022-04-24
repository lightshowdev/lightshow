import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#1C1C1C',
    },
    secondary: {
      main: '#A4A4A4',
    },
    error: {
      main: red.A400,
    },
  },
});

export default theme;
