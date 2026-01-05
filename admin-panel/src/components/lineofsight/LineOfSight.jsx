import { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Refresh as RefreshIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import { GoogleMap, LoadScriptNext, Marker } from '@react-google-maps/api';
import { toast } from 'react-toastify';
import losService from '../../services/losService';
import poleService from '../../services/poleService';
import settingsService from '../../services/settingsService';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 31.5204,
  lng: 74.3587,
};

const LineOfSight = () => {
  const [poles, setPoles] = useState([]);
  const [loadingPoles, setLoadingPoles] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [formData, setFormData] = useState({
    pole_id: '',
    agent_latitude: '',
    agent_longitude: '',
  });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [errors, setErrors] = useState({});
  const [selectedPole, setSelectedPole] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [apiKey, setApiKey] = useState('');
  const [loadingApiKey, setLoadingApiKey] = useState(true);
  const [mapLoadError, setMapLoadError] = useState(false);

  useEffect(() => {
    fetchApiKey();
    fetchPoles();
  }, []);

  const fetchApiKey = async () => {
    setLoadingApiKey(true);
    try {
      const key = await settingsService.getGoogleMapsApiKey();
      setApiKey(key);
    } catch (error) {
      console.error('Error fetching API key:', error);
      toast.error('Failed to load Google Maps API key. Please configure it in Settings.');
    } finally {
      setLoadingApiKey(false);
    }
  };

  const fetchPoles = async () => {
    setLoadingPoles(true);
    try {
      const data = await poleService.getAll();
      setPoles(data.filter((pole) => pole.status === 'active'));
    } catch (error) {
      console.error('Error fetching poles:', error);
      toast.error('Failed to load poles');
    } finally {
      setLoadingPoles(false);
    }
  };

  const fetchHistory = async (poleId) => {
    try {
      const data = await losService.getHistory(poleId);
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors({
      ...errors,
      [name]: '',
    });

    // Fetch history and update map when pole is selected
    if (name === 'pole_id' && value) {
      const poleId = parseInt(value, 10);
      fetchHistory(poleId);
      const pole = poles.find((p) => p.id === poleId);
      if (pole) {
        setSelectedPole(pole);
        setMapCenter({
          lat: parseFloat(pole.latitude),
          lng: parseFloat(pole.longitude),
        });
      }
    }
  };

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    setFormData({
      ...formData,
      agent_latitude: lat.toFixed(6),
      agent_longitude: lng.toFixed(6),
    });

    setErrors({
      ...errors,
      agent_latitude: '',
      agent_longitude: '',
      location: '',
    });

    toast.info('Agent location set on map');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.pole_id) {
      newErrors.pole_id = 'Please select a pole';
    }

    if (!formData.agent_latitude || !formData.agent_longitude) {
      newErrors.location = 'Agent location is required';
    } else {
      const lat = parseFloat(formData.agent_latitude);
      const lng = parseFloat(formData.agent_longitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.agent_latitude = 'Invalid latitude';
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.agent_longitude = 'Invalid longitude';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    setCalculating(true);
    setResult(null);

    try {
      const data = await losService.calculate(
        formData.pole_id,
        parseFloat(formData.agent_latitude),
        parseFloat(formData.agent_longitude)
      );

      setResult(data);
      toast.success('Line of Sight calculated successfully');

      // Refresh history
      fetchHistory(formData.pole_id);
    } catch (error) {
      console.error('Error calculating LoS:', error);
      const message = error.response?.data?.message || 'Failed to calculate Line of Sight';
      toast.error(message);
    } finally {
      setCalculating(false);
    }
  };

  const handleReset = () => {
    setFormData({
      pole_id: '',
      agent_latitude: '',
      agent_longitude: '',
    });
    setResult(null);
    setHistory([]);
    setErrors({});
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'CLEAR':
        return 'success';
      case 'PARTIAL':
        return 'warning';
      case 'BLOCKED':
        return 'error';
      default:
        return 'default';
    }
  };

  if (mapLoadError) {
    return (
      <Alert severity="error">
        Error loading Google Maps. Please check your API key configuration.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Line of Sight Calculator
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Calculate if a pole is visible from an agent's location using elevation data
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 1100 }}>
          <Grid container spacing={3}>
        {/* Calculator Form */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Calculate Line of Sight
              </Typography>

              <form onSubmit={handleCalculate}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl
                      fullWidth
                      required
                      error={!!errors.pole_id}
                      disabled={loadingPoles}
                      sx={{ minWidth: 280 }}
                    >
                      <InputLabel>Select Pole</InputLabel>
                      <Select
                        name="pole_id"
                        value={formData.pole_id}
                        onChange={handleChange}
                        label="Select Pole"
                      >
                        {poles.length === 0 ? (
                          <MenuItem value="" disabled>
                            No active poles found
                          </MenuItem>
                        ) : (
                          poles.map((pole) => (
                            <MenuItem key={pole.id} value={pole.id}>
                              {pole.pole_name} ({pole.pole_height}m)
                            </MenuItem>
                          ))
                        )}
                      </Select>
                      {errors.pole_id && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                          {errors.pole_id}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Agent Location
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Latitude"
                      name="agent_latitude"
                      type="number"
                      value={formData.agent_latitude}
                      onChange={handleChange}
                      error={!!errors.agent_latitude}
                      helperText={errors.agent_latitude}
                      required
                      inputProps={{ step: '0.000001' }}
                      placeholder="31.520370"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Longitude"
                      name="agent_longitude"
                      type="number"
                      value={formData.agent_longitude}
                      onChange={handleChange}
                      error={!!errors.agent_longitude}
                      helperText={errors.agent_longitude}
                      required
                      inputProps={{ step: '0.000001' }}
                      placeholder="74.358749"
                    />
                  </Grid>

                  {errors.location && (
                    <Grid item xs={12}>
                      <Alert severity="error">{errors.location}</Alert>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          type="submit"
                          variant="contained"
                          startIcon={calculating ? <CircularProgress size={20} color="inherit" /> : <CalculateIcon />}
                          disabled={calculating}
                        >
                          {calculating ? 'Calculating...' : 'Calculate'}
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<RefreshIcon />}
                          onClick={handleReset}
                        >
                          Reset
                        </Button>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </form>

              {/* Result Display */}
              {result && (
                <Box sx={{ mt: 3 }}>
                  <Alert severity={result.result === 'CLEAR' ? 'success' : result.result === 'PARTIAL' ? 'warning' : 'error'}>
                    <Typography variant="h6" gutterBottom>
                      Result: {result.result}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Pole:</strong> {result.pole?.name}<br />
                      <strong>Pole Ground Elevation:</strong> {result.elevations?.pole_ground_elevation}m<br />
                      <strong>Pole Top Elevation:</strong> {result.elevations?.pole_top_elevation}m<br />
                      <strong>Agent Elevation:</strong> {result.elevations?.agent_elevation}m<br />
                      <strong>Elevation Difference:</strong> {result.elevations?.elevation_difference}m<br />
                      <strong>Distance from Pole:</strong> {result.distance_from_pole}m
                    </Typography>
                    {result.result === 'PARTIAL' && result.extra_height_required && (
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                        Extra Height Required: {result.extra_height_required}m
                      </Typography>
                    )}
                    {result.result === 'BLOCKED' && (
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold', color: 'error.main' }}>
                        Line of Sight is blocked. The agent location is at a higher elevation or obstructed.
                      </Typography>
                    )}
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Google Maps - Click to Set Agent Location */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Agent Location on Map
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Click on the map to set the agent's location, or enter coordinates manually above
              </Typography>

      {loadingApiKey ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      ) : !apiKey ? (
        <Alert severity="warning">
          Google Maps API key not configured. Please configure it in Settings first.
        </Alert>
      ) : (
        <LoadScriptNext
          key={apiKey}
          googleMapsApiKey={apiKey}
          onError={() => setMapLoadError(true)}
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={13}
            onClick={handleMapClick}
                  >
                    {/* Selected Pole Marker */}
                    {selectedPole && (
                      <Marker
                        position={{
                          lat: parseFloat(selectedPole.latitude),
                          lng: parseFloat(selectedPole.longitude),
                        }}
                        title={selectedPole.pole_name}
                        label={{
                          text: 'P',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                        icon={{
                          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                        }}
                      />
                    )}

                    {/* Agent Location Marker */}
                    {formData.agent_latitude && formData.agent_longitude && (
                      <Marker
                        position={{
                          lat: parseFloat(formData.agent_latitude),
                          lng: parseFloat(formData.agent_longitude),
                        }}
                        title="Agent Location"
                        label={{
                          text: 'A',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                        icon={{
                          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                        }}
                      />
                    )}
          </GoogleMap>
        </LoadScriptNext>
      )}

              {/* Instructions */}
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  <strong>Blue Marker (P):</strong> Selected Pole Location<br />
                  <strong>Red Marker (A):</strong> Agent Location (click map or enter coordinates above)
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Calculation History */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Calculation History
              </Typography>

              {formData.pole_id ? (
                history.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No calculation history for this pole.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Date</strong></TableCell>
                          <TableCell><strong>Location</strong></TableCell>
                          <TableCell><strong>Result</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {history.slice(0, 10).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Typography variant="caption">
                                {new Date(item.calculated_at).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {parseFloat(item.agent_latitude).toFixed(4)}, {parseFloat(item.agent_longitude).toFixed(4)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={item.result}
                                color={getResultColor(item.result)}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  Select a pole to view calculation history.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default LineOfSight;
