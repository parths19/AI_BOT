import React, { useState } from 'react';
import { Box, TextField, Button, Typography, CircularProgress, Alert, useTheme, Paper, Fade } from '@mui/material';
import { Send, QuestionAnswer } from '@mui/icons-material';
import axios from 'axios';
import { alpha } from '@mui/material/styles';

const AskAnything: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setAnswer(null);
    setContext(null);

    try {
      const response = await axios.post('http://localhost:8000/ask', {
        question: question.trim()
      });

      if (response.data) {
        setAnswer(response.data.answer);
        setContext(response.data.context);
      } else {
        setError('Received invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to get answer';
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography 
        variant="h5" 
        gutterBottom
        sx={{
          fontWeight: 600,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <QuestionAnswer /> Ask Anything
      </Typography>
      <Typography variant="body1" gutterBottom color="text.secondary" sx={{ mb: 3 }}>
        Ask any question about the document and get AI-powered answers
      </Typography>

      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          backgroundColor: theme.palette.background.default,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Your Question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            multiline
            rows={2}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.background.paper,
              },
            }}
            error={!!error}
            helperText={error || ''}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !question.trim()}
            endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
            sx={{
              px: 4,
              py: 1.5,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
              },
            }}
          >
            {loading ? 'Processing...' : 'Ask Question'}
          </Button>
        </form>

        {loading && (
          <Box sx={{ 
            mt: 3,
            display: 'flex',
            alignItems: 'center',
            p: 2,
            borderRadius: 2,
            backgroundColor: 'action.hover',
          }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Box>
              <Typography variant="body1" fontWeight={500}>
                Analyzing document...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Finding the best answer for you
              </Typography>
            </Box>
          </Box>
        )}

        {error && (
          <Fade in>
            <Alert 
              severity="error" 
              sx={{ 
                mt: 3,
                borderRadius: 2,
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}
            >
              <Typography variant="body1" fontWeight={500}>
                {error}
              </Typography>
            </Alert>
          </Fade>
        )}

        {answer && (
          <Fade in>
            <Box sx={{ mt: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ 
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                  }}
                >
                  Answer
                </Typography>
                <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                  {answer}
                </Typography>
                {context && (
                  <Box sx={{ mt: 3 }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        color: theme.palette.secondary.main,
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      Supporting Context
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ whiteSpace: 'pre-wrap' }}
                      >
                        {context}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Paper>
            </Box>
          </Fade>
        )}
      </Paper>
    </Box>
  );
};

export default AskAnything; 