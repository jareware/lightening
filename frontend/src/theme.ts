import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#03a9f4' },
    secondary: { main: '#ffd54f' },
    background: {
      default: '#1c1c1c',
      paper: '#2c2c2c',
    },
  },
});
