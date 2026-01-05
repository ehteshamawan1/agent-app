import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { GoogleMap, LoadScriptNext, Polygon, DrawingManager } from '@react-google-maps/api';
import zoneService from '../../services/zoneService';
import settingsService from '../../services/settingsService';

const libraries = ['drawing', 'geometry'];

const ZoneForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [loadingApiKey, setLoadingApiKey] = useState(true);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [formData, setFormData] = useState({
    zone_name: '',
    description: '',
  });
  const [zoneBoundary, setZoneBoundary] = useState([]);
  const [errors, setErrors] = useState({});
  const [map, setMap] = useState(null);
  const [drawingManager, setDrawingManager] = useState(null);

  useEffect(() => {
    fetchApiKey();
    if (isEditMode) {
      fetchZone();
    }
  }, [id]);

  const fetchApiKey = async () => {
    try {
      const key = await settingsService.getGoogleMapsApiKey();
      setApiKey(key);
    } catch (error) {
      console.error('Error fetching API key:', error);
      toast.error('Google Maps API key not configured. Please set it in Settings.');
    } finally {
      setLoadingApiKey(false);
    }
  };

  const fetchZone = async () => {
    setLoading(true);
    try {
      const data = await zoneService.getById(id);
      setFormData({
        zone_name: data.zone_name,
        description: data.description || '',
      });

      // Parse zone boundary
      const boundary = typeof data.zone_boundary === 'string'
        ? JSON.parse(data.zone_boundary)
        : data.zone_boundary;
      setZoneBoundary(boundary);
    } catch (error) {
      console.error('Error fetching zone:', error);
      toast.error('Failed to load zone');
      navigate('/zones');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors({
      ...errors,
      [e.target.name]: '',
    });
  };

  const onPolygonComplete = useCallback((polygon) => {
    // Get the path coordinates
    const path = polygon.getPath();
    const coordinates = [];

    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coordinates.push({
        lat: point.lat(),
        lng: point.lng(),
      });
    }

    setZoneBoundary(coordinates);

    // Remove the drawn polygon (we'll display it separately)
    polygon.setMap(null);

    // Clear drawing mode
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }

    toast.success('Zone boundary drawn successfully');
  }, [drawingManager]);

  const handleClearBoundary = () => {
    setZoneBoundary([]);
    toast.info('Zone boundary cleared');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.zone_name.trim()) {
      newErrors.zone_name = 'Zone name is required';
    }

    if (zoneBoundary.length < 3) {
      newErrors.boundary = 'Please draw a zone boundary on the map (minimum 3 points)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        zone_boundary: zoneBoundary,
      };

      if (isEditMode) {
        await zoneService.update(id, payload);
        toast.success('Zone updated successfully');
      } else {
        await zoneService.create(payload);
        toast.success('Zone created successfully');
      }

      navigate('/zones');
    } catch (error) {
      console.error('Error saving zone:', error);
      const message = error.response?.data?.message || 'Failed to save zone';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/zones')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4">
            {isEditMode ? 'Edit Zone' : 'Create New Zone'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Draw a zone boundary on the map to define the geographic area
        </Typography>
      </Paper>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Form Fields */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Zone Details
                </Typography>

                <TextField
                  fullWidth
                  label="Zone Name"
                  name="zone_name"
                  value={formData.zone_name}
                  onChange={handleChange}
                  error={!!errors.zone_name}
                  helperText={errors.zone_name}
                  required
                  sx={{ mb: 2 }}
                  placeholder="e.g., Lahore North"
                />

                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  placeholder="Optional description"
                  sx={{ mb: 2 }}
                />

                {errors.boundary && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.boundary}
                  </Alert>
                )}

                {zoneBoundary.length >= 3 && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Zone boundary defined ({zoneBoundary.length} points)
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleClearBoundary}
                    disabled={zoneBoundary.length === 0}
                  >
                    Clear Boundary
                  </Button>
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : isEditMode ? 'Update Zone' : 'Create Zone'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Map */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Draw Zone Boundary
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Use the polygon tool to draw the zone boundary. Click to add points, and click the first point again to close the polygon.
                </Typography>

                {mapLoadError ? (
                  <Alert severity="error">
                    Error loading Google Maps. Please check your API key configuration.
                  </Alert>
                ) : loadingApiKey ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 500 }}>
                    <CircularProgress />
                  </Box>
                ) : !apiKey ? (
                  <Alert severity="warning">
                    Google Maps API key not configured. Please configure it in Settings first.
                  </Alert>
                ) : (
                  <Box sx={{ height: 500, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <LoadScriptNext
                      key={apiKey}
                      googleMapsApiKey={apiKey}
                      libraries={libraries}
                      onError={() => setMapLoadError(true)}
                    >
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={{ lat: 31.5204, lng: 74.3587 }} // Default: Lahore
                        zoom={11}
                        onLoad={(map) => setMap(map)}
                      >
                        {/* Drawing Manager for new zones */}
                        {!isEditMode || zoneBoundary.length === 0 ? (
                          <DrawingManager
                            onLoad={(dm) => setDrawingManager(dm)}
                            onPolygonComplete={onPolygonComplete}
                            options={{
                              drawingControl: true,
                              drawingControlOptions: {
                                position: window.google?.maps?.ControlPosition?.TOP_CENTER,
                                drawingModes: [window.google?.maps?.drawing?.OverlayType?.POLYGON],
                              },
                              polygonOptions: {
                                fillColor: '#1976D2',
                                fillOpacity: 0.3,
                                strokeWeight: 2,
                                strokeColor: '#1976D2',
                                clickable: true,
                                editable: false,
                                zIndex: 1,
                              },
                            }}
                          />
                        ) : null}

                        {/* Display existing boundary */}
                        {zoneBoundary.length >= 3 && (
                          <Polygon
                            paths={zoneBoundary}
                            options={{
                              fillColor: '#1976D2',
                              fillOpacity: 0.3,
                              strokeWeight: 2,
                              strokeColor: '#1976D2',
                              clickable: false,
                            }}
                          />
                        )}
                      </GoogleMap>
                    </LoadScriptNext>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default ZoneForm;
