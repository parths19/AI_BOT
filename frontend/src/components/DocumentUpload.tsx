import React, { useState, useCallback } from 'react';
import { Box, Button, Typography, CircularProgress, useTheme } from '@mui/material';
import { UploadFile, CheckCircleOutline } from '@mui/icons-material';
import axios from 'axios';

interface DocumentUploadProps {
  onUploadSuccess: (filename: string, summary: string) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const theme = useTheme();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, []);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.txt')) {
      setError('Only PDF and TXT files are supported');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        onUploadSuccess(file.name, response.data.summary);
      } else {
        setError('Upload failed: ' + (response.data.detail || 'Unknown error'));
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Error uploading file';
      setError(`Upload failed: ${errorMessage}`);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
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
        }}
      >
        Upload Document
      </Typography>
      <Typography variant="body1" gutterBottom color="text.secondary" sx={{ mb: 3 }}>
        Upload a PDF or TXT file to get started with AI-powered document analysis
      </Typography>

      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 6,
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'grey.300',
          borderRadius: 3,
          cursor: 'pointer',
          backgroundColor: dragActive ? 'action.hover' : 'transparent',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
            transform: 'translateY(-4px)',
          },
        }}
      >
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="file-upload"
          disabled={uploading}
        />
        <label htmlFor="file-upload" style={{ width: '100%', textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <UploadFile 
              sx={{ 
                fontSize: 64,
                color: theme.palette.primary.main,
                opacity: uploading ? 0.5 : 1,
              }} 
            />
          </Box>
          <Button
            component="span"
            variant="contained"
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <UploadFile />}
            disabled={uploading}
            sx={{
              mb: 2,
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
              },
            }}
          >
            {uploading ? 'Uploading...' : 'Choose File'}
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            or drag and drop your file here
          </Typography>
        </label>

        {uploading && (
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
                Processing document...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This may take a few moments
              </Typography>
            </Box>
          </Box>
        )}

        {error && (
          <Box sx={{ 
            mt: 3,
            p: 2,
            borderRadius: 2,
            backgroundColor: 'error.light',
            color: 'error.main',
            width: '100%',
          }}>
            <Typography variant="body1" fontWeight={500}>
              {error}
            </Typography>
          </Box>
        )}
      </Box>

      <Typography 
        variant="body2" 
        color="text.secondary" 
        align="center" 
        sx={{ mt: 3 }}
      >
        Supported file types: PDF, TXT • Max file size: 10MB
      </Typography>
    </Box>
  );
};

export default DocumentUpload; 