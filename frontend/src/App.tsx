import { useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useHass } from './hooks/useHass';
import { useFloorplan } from './hooks/useFloorplan';
import { useConfig } from './hooks/useConfig';

function App() {
  const hass = useHass();
  const { svg, loading, error, upload, remove } = useFloorplan(hass);
  const { error: configError } = useConfig(hass);
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (file: File | undefined) => {
    if (file) upload(file);
  };

  if (!hass.available) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Lightening can't reach Home Assistant. Open it from the Home Assistant
          sidebar rather than directly.
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pick(e.dataTransfer.files[0]);
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 400 }}>
          Lightening
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <input
            ref={fileInput}
            type="file"
            accept="image/svg+xml,.svg"
            hidden
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = ''; // let the same file be picked again
            }}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileInput.current?.click()}
          >
            {svg ? 'Replace floorplan' : 'Upload floorplan'}
          </Button>
          {svg && (
            <Tooltip title="Remove floorplan">
              <IconButton size="small" color="error" onClick={remove}>
                <DeleteOutlinedIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {(error || configError) && (
        <Alert severity="error" sx={{ borderRadius: 0 }}>
          {error ?? configError}
        </Alert>
      )}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: dragging ? '2px dashed' : 'none',
          outlineColor: 'primary.main',
          outlineOffset: -8,
        }}
      >
        {loading ? (
          <CircularProgress />
        ) : svg ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& svg': { maxWidth: '100%', maxHeight: '100%', height: 'auto' },
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <Paper
            variant="outlined"
            onClick={() => fileInput.current?.click()}
            sx={{
              p: 6,
              textAlign: 'center',
              borderStyle: 'dashed',
              borderWidth: 2,
              cursor: 'pointer',
              bgcolor: 'transparent',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary">
              Drop an SVG floorplan here, or click to choose one
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

export default App;
