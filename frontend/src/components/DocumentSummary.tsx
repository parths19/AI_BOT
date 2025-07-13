import React from 'react';
import { Box, Typography } from '@mui/material';

interface DocumentSummaryProps {
  filename: string;
  summary: string;
}

const DocumentSummary: React.FC<DocumentSummaryProps> = ({ filename, summary }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Document Summary
      </Typography>
      <Typography variant="subtitle1" gutterBottom color="text.secondary">
        {filename}
      </Typography>
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
        {summary}
      </Typography>
    </Box>
  );
};

export default DocumentSummary; 