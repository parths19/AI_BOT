import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  Paper,
  Fade,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
} from '@mui/material';
import { EmojiEvents, Send, Refresh } from '@mui/icons-material';
import axios from 'axios';
import { alpha } from '@mui/material/styles';

interface Question {
  question: string;
  answer: string;
  context: string;
}

interface ErrorResponse {
  type?: string;
  loc?: string[];
  msg?: string;
  input?: any;
  url?: string;
}

const ChallengeMode: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [feedback, setFeedback] = useState<{ [key: number]: { isCorrect: boolean; message: string; reference: string } }>({});
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [answerErrors, setAnswerErrors] = useState<{ [key: number]: string }>({});
  const theme = useTheme();

  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) return detail.map(err => err.msg).join(', ');
      if (detail.msg) return detail.msg;
    }
    return error?.message || 'An unexpected error occurred';
  };

  const generateQuestions = async () => {
    setGeneratingQuestions(true);
    setError(null);
    setQuestions([]);
    setUserAnswers({});
    setFeedback({});
    setAnswerErrors({});

    try {
      const response = await axios.post('http://localhost:8000/challenge');
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setQuestions(response.data);
      } else {
        setError('No questions could be generated. Please try again.');
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
      console.error('Error:', err);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleAnswerSubmit = async (index: number) => {
    const userAnswer = userAnswers[index];
    if (!userAnswer?.trim()) return;

    setLoading(true);
    setAnswerErrors({ ...answerErrors, [index]: '' });

    try {
      const response = await axios.post(`http://localhost:8000/evaluate?question=${encodeURIComponent(questions[index].question)}&user_answer=${encodeURIComponent(userAnswer.trim())}`);

      setFeedback(prev => ({
        ...prev,
        [index]: {
          isCorrect: response.data.is_correct,
          message: response.data.feedback,
          reference: response.data.reference
        }
      }));
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setAnswerErrors(prev => ({ ...prev, [index]: errorMessage }));
      console.error('Error evaluating answer:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = () => {
    if (questions.length === 0) return 0;
    return (Object.keys(feedback).length / questions.length) * 100;
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
        <EmojiEvents /> Challenge Mode
      </Typography>
      <Typography variant="body1" gutterBottom color="text.secondary" sx={{ mb: 3 }}>
        Test your understanding with AI-generated questions based on the document
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Button
            variant="contained"
            onClick={generateQuestions}
            disabled={generatingQuestions}
            startIcon={generatingQuestions ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
            sx={{
              px: 4,
              py: 1.5,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
              },
            }}
          >
            {generatingQuestions ? 'Generating Questions...' : 'Generate New Questions'}
          </Button>

          {questions.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Progress: {Math.round(getProgress())}%
            </Typography>
          )}
        </Box>

        {generatingQuestions && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            p: 2,
            borderRadius: 2,
            backgroundColor: 'action.hover',
            mb: 3,
          }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Box>
              <Typography variant="body1" fontWeight={500}>
                Generating questions...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Creating challenging questions based on the document
              </Typography>
            </Box>
          </Box>
        )}

        {error && (
          <Fade in>
            <Alert
              severity="error"
              sx={{
                mb: 3,
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

        {questions.length > 0 && (
          <Stepper
            activeStep={Object.keys(feedback).length}
            alternativeLabel
            sx={{ mb: 4 }}
          >
            {questions.map((_, index) => (
              <Step key={index}>
                <StepLabel>Question {index + 1}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {questions.map((question, index) => (
          <Fade in key={index}>
            <Card
              elevation={0}
              sx={{
                mb: 3,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                  }}
                >
                  Question {index + 1}
                </Typography>
                <Typography
                  variant="body1"
                  paragraph
                  sx={{
                    fontSize: '1.1rem',
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                  }}
                >
                  {question.question}
                </Typography>
                <TextField
                  fullWidth
                  label="Your Answer"
                  multiline
                  rows={3}
                  value={userAnswers[index] || ''}
                  onChange={(e) => setUserAnswers(prev => ({ ...prev, [index]: e.target.value }))}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.background.paper,
                    },
                  }}
                  disabled={!!feedback[index]}
                  error={!!answerErrors[index]}
                  helperText={answerErrors[index] || ''}
                />
                {!feedback[index] && (
                  <Button
                    variant="contained"
                    onClick={() => handleAnswerSubmit(index)}
                    disabled={loading || !userAnswers[index]?.trim()}
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
                    {loading ? 'Checking...' : 'Submit Answer'}
                  </Button>
                )}

                {feedback[index] && (
                  <Fade in>
                    <Box sx={{ mt: 3 }}>
                      <Alert
                        severity={feedback[index].isCorrect ? "success" : "warning"}
                        sx={{
                          mb: 2,
                          borderRadius: 2,
                          '& .MuiAlert-message': {
                            width: '100%',
                          },
                        }}
                        icon={feedback[index].isCorrect ? <EmojiEvents /> : undefined}
                      >
                        <Typography variant="body1" fontWeight={500}>
                          {feedback[index].message}
                        </Typography>
                      </Alert>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: theme.palette.secondary.main,
                            fontWeight: 600,
                            mb: 1,
                          }}
                        >
                          Reference Context
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ whiteSpace: 'pre-wrap' }}
                        >
                          {feedback[index].reference}
                        </Typography>
                      </Paper>
                    </Box>
                  </Fade>
                )}
              </CardContent>
            </Card>
          </Fade>
        ))}
      </Paper>
    </Box>
  );
};

export default ChallengeMode; 