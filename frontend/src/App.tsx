import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  ThemeProvider,
  createTheme,
  CssBaseline,
  useMediaQuery,
  alpha
} from '@mui/material';
import DocumentUpload from './components/DocumentUpload';
import AskAnything from './components/AskAnything';
import ChallengeMode from './components/ChallengeMode';
import DocumentSummary from './components/DocumentSummary';

// Create a custom theme with modern styling
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Modern blue
      light: '#60a5fa',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#7c3aed', // Modern purple
      light: '#a78bfa',
      dark: '#5b21b6',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            },
            '&.Mui-focused': {
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            },
          },
        },
      },
    },
  },
});

function App() {
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDocumentUpload = (uploadedFilename: string, documentSummary: string) => {
    setDocumentUploaded(true);
    setSummary(documentSummary);
    setFilename(uploadedFilename);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`,
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography
              variant="h1"
              component="h1"
              gutterBottom
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mb: 2,
              }}
            >
              AI Document Assistant
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: '600px', mx: 'auto', mb: 4 }}
            >
              Upload your documents and let AI help you understand, analyze, and learn from them.
            </Typography>
          </Box>

          <Box sx={{
            display: 'grid',
            gap: 4,
            gridTemplateColumns: isSmallScreen ? '1fr' : documentUploaded ? '1fr' : '1fr',
          }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                background: theme.palette.background.paper,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <DocumentUpload onUploadSuccess={handleDocumentUpload} />
            </Paper>

            {documentUploaded && (
              <>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    background: theme.palette.background.paper,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}
                >
                  <DocumentSummary filename={filename} summary={summary} />
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    background: theme.palette.background.paper,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}
                >
                  <AskAnything />
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    background: theme.palette.background.paper,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}
                >
                  <ChallengeMode />
                </Paper>
              </>
            )}
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
