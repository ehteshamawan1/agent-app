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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { GoogleMap, LoadScriptNext, Marker, Circle, Polygon } from '@react-google-maps/api';
import poleService from '../../services/poleService';
import landOwnerService from '../../services/landOwnerService';
import settingsService from '../../services/settingsService';
import zoneService from '../../services/zoneService';
import { useAuth } from '../../context/AuthContext';

const PoleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { user, isSuperAdmin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [loadingApiKey, setLoadingApiKey] = useState(true);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [landOwners, setLandOwners] = useState([]);
  const [zones, setZones] = useState([]);
  const [zoneBoundary, setZoneBoundary] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [formData, setFormData] = useState({
    pole_name: '',
    latitude: '',
    longitude: '',
    pole_height: '',
    restricted_radius: '500',
    land_owner_id: '',
    zone_id: '',
    prevent_overlap: false,
  });
  const [mapCenter, setMapCenter] = useState({ lat: 31.5204, lng: 74.3587 }); // Default: Lahore
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchApiKey();
    fetchLandOwners();
    fetchZones();
    if (isEditMode) {
      fetchPole();
    }
  }, [id]);

  useEffect(() => {
    if (!isSuperAdmin() && user?.zone_id) {
      setFormData((prev) => ({
        ...prev,
        zone_id: user.zone_id,
      }));
      fetchZoneBoundary(user.zone_id);
    }
  }, [user, isSuperAdmin]);

  const fetchApiKey = async () => {
    try {
      const key = await settingsService.getGoogleMapsApiKey();
      setApiKey(key);
    } catch (error) {
      console.error('Error fetching API key:', error);
      toast.error('Google Maps API key not configured');
    } finally {
      setLoadingApiKey(false);
    }
  };

  const fetchZones = async () => {
    if (isSuperAdmin()) {
      try {
        const data = await zoneService.getAll();
        setZones(data.filter((zone) => zone.status === 'active'));
      } catch (error) {
        console.error('Error fetching zones:', error);
      }
    }
  };

  const fetchLandOwners = async () => {
    try {
      const data = await landOwnerService.getAll();
      setLandOwners(data);
    } catch (error) {
      console.error('Error fetching land owners:', error);
      toast.error('Failed to load land owners');
    }
  };

  const fetchZoneBoundary = async (zoneId) => {
    if (!zoneId) {
      setZoneBoundary(null);
      return;
    }
    try {
      const zoneData = await zoneService.getById(zoneId);
      if (zoneData.zone_boundary) {
        const boundary = typeof zoneData.zone_boundary === 'string'
          ? JSON.parse(zoneData.zone_boundary)
          : zoneData.zone_boundary;
        setZoneBoundary(boundary);
        if (!formData.latitude && !formData.longitude && boundary.length > 0) {
          const firstPoint = boundary[0];
          setMapCenter({ lat: firstPoint.lat, lng: firstPoint.lng });
        }
      }
    } catch (error) {
      console.error('Error fetching zone boundary:', error);
    }
  };

  const fetchPole = async () => {
    setLoading(true);
    try {
      const data = await poleService.getById(id);
      setFormData({
        pole_name: data.pole_name,
        latitude: data.latitude,
        longitude: data.longitude,
        pole_height: data.pole_height,
        restricted_radius: data.restricted_radius,
        land_owner_id: data.land_owner_id || '',
        zone_id: data.zone_id || '',
      });
      if (data.zone_id) {
        fetchZoneBoundary(data.zone_id);
      }
      setMapCenter({
        lat: parseFloat(data.latitude),
        lng: parseFloat(data.longitude),
      });
    } catch (error) {
      console.error('Error fetching pole:', error);
      toast.error('Failed to load pole');
      navigate('/poles');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextData = {
      ...formData,
      [name]: value,
    };
    setFormData(nextData);
    setErrors({
      ...errors,
      [name]: '',
    });
    if (name === 'zone_id') {
      fetchZoneBoundary(value);
    }
  };
  const handleToggleChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const updateMapFromCoordinates = (latValue, lngValue) => {
    const lat = parseFloat(latValue);
    const lng = parseFloat(lngValue);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return;
    }
    const newCenter = { lat, lng };
    setMapCenter(newCenter);
    if (mapInstance) {
      mapInstance.panTo(newCenter);
    }
  };

  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    const nextData = {
      ...formData,
      [name]: value,
    };
    setFormData(nextData);
    setErrors({
      ...errors,
      [name]: '',
      location: '',
    });
    updateMapFromCoordinates(nextData.latitude, nextData.longitude);
  };

  const handleMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toFixed(8),
      longitude: lng.toFixed(8),
    }));
    setMapCenter({ lat, lng });
    if (mapInstance) {
      mapInstance.panTo({ lat, lng });
    }
    setErrors((prev) => ({
      ...prev,
      latitude: '',
      longitude: '',
      location: '',
    }));
    toast.success('Location selected');
  }, [mapInstance]);

  const handleMapLoad = useCallback((map) => {
    setMapInstance(map);
  }, []);

  useEffect(() => {
    if (!mapInstance || !zoneBoundary || zoneBoundary.length === 0) {
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    zoneBoundary.forEach((point) => {
      bounds.extend(new window.google.maps.LatLng(point.lat, point.lng));
    });
    mapInstance.fitBounds(bounds);
  }, [mapInstance, zoneBoundary]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.pole_name.trim()) {
      newErrors.pole_name = 'Pole name is required';
    }

    if (isSuperAdmin() && !formData.zone_id) {
      newErrors.zone_id = 'Zone is required for super admin';
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.location = 'Please select a location on the map';
    } else {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Invalid latitude';
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = 'Invalid longitude';
      }
    }

    if (!formData.pole_height || parseFloat(formData.pole_height) <= 0) {
      newErrors.pole_height = 'Pole height must be greater than 0';
    }

    const radius = parseFloat(formData.restricted_radius);
    if (!formData.restricted_radius || radius < 50 || radius > 5000) {
      newErrors.restricted_radius = 'Radius must be between 50 and 5000 meters';
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
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        pole_height: parseFloat(formData.pole_height),
        restricted_radius: parseFloat(formData.restricted_radius),
        land_owner_id: formData.land_owner_id || null,
        zone_id: isSuperAdmin() ? parseInt(formData.zone_id, 10) : user?.zone_id,
      };

      if (isEditMode) {
        await poleService.update(id, payload);
        toast.success('Pole updated successfully');
      } else {
        await poleService.create({
          ...payload,
          prevent_overlap: formData.prevent_overlap,
        });
        toast.success('Pole created successfully');
      }

      navigate('/poles');
    } catch (error) {
      console.error('Error saving pole:', error);
      const message = error.response?.data?.message || 'Failed to save pole';
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
            onClick={() => navigate('/poles')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4">
            {isEditMode ? 'Edit Pole' : 'Add New Pole'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {isSuperAdmin()
            ? 'Add or edit pole information'
            : `Adding pole to zone: ${user?.zone?.zone_name}`}
        </Typography>
      </Paper>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Form Fields */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pole Details
                </Typography>

                <TextField
                  fullWidth
                  label="Pole Name"
                  name="pole_name"
                  value={formData.pole_name}
                  onChange={handleChange}
                  error={!!errors.pole_name}
                  helperText={errors.pole_name}
                  required
                  sx={{ mb: 2 }}
                  placeholder="e.g., Tower-A-001"
                />

                <TextField
                  fullWidth
                  label="Pole Height (meters)"
                  name="pole_height"
                  type="number"
                  value={formData.pole_height}
                  onChange={handleChange}
                  error={!!errors.pole_height}
                  helperText={errors.pole_height}
                  required
                  sx={{ mb: 2 }}
                  inputProps={{ step: '0.1', min: '0' }}
                />

                {isSuperAdmin() && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Zone</InputLabel>
                    <Select
                      name="zone_id"
                      value={formData.zone_id}
                      onChange={handleChange}
                      label="Zone"
                      error={!!errors.zone_id}
                    >
                      {zones.length === 0 ? (
                        <MenuItem value="" disabled>
                          No zones available
                        </MenuItem>
                      ) : (
                        zones.map((zone) => (
                          <MenuItem key={zone.id} value={zone.id}>
                            {zone.zone_name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {errors.zone_id && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.zone_id}
                      </Typography>
                    )}
                  </FormControl>
                )}

                <TextField
                  fullWidth
                  label="Latitude"
                  name="latitude"
                  type="number"
                  value={formData.latitude}
                  onChange={handleCoordinateChange}
                  error={!!errors.latitude}
                  helperText={errors.latitude || 'Enter a value between -90 and 90'}
                  required
                  sx={{ mb: 2 }}
                  inputProps={{ step: '0.00000001', min: '-90', max: '90' }}
                />

                <TextField
                  fullWidth
                  label="Longitude"
                  name="longitude"
                  type="number"
                  value={formData.longitude}
                  onChange={handleCoordinateChange}
                  error={!!errors.longitude}
                  helperText={errors.longitude || 'Enter a value between -180 and 180'}
                  required
                  sx={{ mb: 2 }}
                  inputProps={{ step: '0.00000001', min: '-180', max: '180' }}
                />

                <TextField
                  fullWidth
                  label="Restricted Radius (meters)"
                  name="restricted_radius"
                  type="number"
                  value={formData.restricted_radius}
                  onChange={handleChange}
                  error={!!errors.restricted_radius}
                  helperText={errors.restricted_radius || 'Between 50 and 5000 meters'}
                  required
                  sx={{ mb: 2 }}
                  inputProps={{ step: '1', min: '50', max: '5000' }}
                />

                {!isEditMode && (
                  <FormControlLabel
                    control={(
                      <Switch
                        checked={formData.prevent_overlap}
                        onChange={handleToggleChange}
                        name="prevent_overlap"
                        color="primary"
                      />
                    )}
                    label="Prevent overlap with existing poles"
                    sx={{ mb: 2 }}
                  />
                )}

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Land Owner (Optional)</InputLabel>
                  <Select
                    name="land_owner_id"
                    value={formData.land_owner_id}
                    onChange={handleChange}
                    label="Land Owner (Optional)"
                  >
                    <MenuItem value="">None</MenuItem>
                    {landOwners
                      .filter((owner) => !isSuperAdmin() || !formData.zone_id || owner.zone_id === parseInt(formData.zone_id, 10))
                      .map((owner) => (
                        <MenuItem key={owner.id} value={owner.id}>
                          {owner.owner_name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                {errors.location && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.location}
                  </Alert>
                )}

                {formData.latitude && formData.longitude && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Location: {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                  </Alert>
                )}

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : isEditMode ? 'Update Pole' : 'Create Pole'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Map */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Select Location on Map
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Click on the map or enter coordinates to set the pole location. The circle shows the restricted radius.
                  {zoneBoundary && ' The blue boundary shows the selected zone.'}
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
                      onError={() => setMapLoadError(true)}
                    >
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={mapCenter}
                        zoom={15}
                        onClick={handleMapClick}
                        onLoad={handleMapLoad}
                      >
                        {/* Zone Boundary Overlay (for regular admins) */}
                        {zoneBoundary && zoneBoundary.length > 0 && (
                          <Polygon
                            paths={zoneBoundary}
                            options={{
                              fillColor: '#1976D2',
                              fillOpacity: 0.1,
                              strokeColor: '#1976D2',
                              strokeWeight: 2,
                              strokeOpacity: 0.8,
                              clickable: false,
                            }}
                          />
                        )}

                        {formData.latitude && formData.longitude && (
                          <>
                            <Marker
                              position={{
                                lat: parseFloat(formData.latitude),
                                lng: parseFloat(formData.longitude),
                              }}
                            />
                            <Circle
                              center={{
                                lat: parseFloat(formData.latitude),
                                lng: parseFloat(formData.longitude),
                              }}
                              radius={parseFloat(formData.restricted_radius || 500)}
                              options={{
                                fillColor: '#F44336',
                                fillOpacity: 0.2,
                                strokeColor: '#F44336',
                                strokeWeight: 2,
                              }}
                            />
                          </>
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

export default PoleForm;
