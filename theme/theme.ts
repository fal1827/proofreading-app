'use client';
import { createTheme } from '@mui/material/styles';
import { Roboto, Noto_Sans_JP } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Clean Blue
    },
    background: {
      default: '#f5f5f5', // Light Gray for contrast
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: `${notoSansJP.style.fontFamily}, ${roboto.style.fontFamily}, sans-serif`,
  },
});

export default theme;
