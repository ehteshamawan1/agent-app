import { useState, useEffect, Fragment } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { GoogleMap, LoadScriptNext, Marker, Circle, Polygon, InfoWindow } from '@react-google-maps/api';
import poleService from '../../services/poleService';
import zoneService from '../../services/zoneService';
import settingsService from '../../services/settingsService';
import { useAuth } from '../../context/AuthContext';

const MapView = () => {
  const { user, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [loadingApiKey, setLoadingApiKey] = useState(true);
  const [poles, setPoles] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedPole, setSelectedPole] = useState(null);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('all');
  const [showZoneBoundaries, setShowZoneBoundaries] = useState(true);
  const [showRadius, setShowRadius] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 31.5204, lng: 74.3587 });
  const [mapLoadError, setMapLoadError] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    fetchApiKey();
    fetchZones();
  }, []);

  useEffect(() => {
    fetchPoles();
  }, [selectedZoneFilter]);

  const fetchApiKey = async () => {
    setLoadingApiKey(true);
    try {
      const key = await settingsService.getGoogleMapsApiKey();
      setApiKey(key);
    } catch (error) {
      console.error('Error fetching API key:', error);
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
    } else if (user?.zone) {
      setZones([user.zone]);
    }
  };

  const isValidCoordinate = (value, min, max) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) && parsed >= min && parsed <= max;
  };

  const sanitizeBoundary = (boundary) => {
    if (!Array.isArray(boundary)) {
      return [];
    }
    return boundary.filter((point) => (
      isValidCoordinate(point?.lat, -90, 90) && isValidCoordinate(point?.lng, -180, 180)
    ));
  };

  const isValidRadius = (value) => {
    const radius = parseFloat(value);
    return Number.isFinite(radius) && radius > 0;
  };

  const fetchPoles = async () => {
    setLoading(true);
    try {
      let data = await poleService.getAll();

      // Filter by selected zone for Super Admin
      if (isSuperAdmin() && selectedZoneFilter !== 'all') {
        data = data.filter((pole) => pole.zone_id === parseInt(selectedZoneFilter));
      }

      const activePoles = data.filter((pole) => pole.status === 'active');
      const safePoles = activePoles.filter((pole) => (
        isValidCoordinate(pole.latitude, -90, 90) && isValidCoordinate(pole.longitude, -180, 180)
      ));
      setPoles(safePoles);

      // Set map center to first pole or user's zone center
      if (safePoles.length > 0) {
        setMapCenter({
          lat: parseFloat(safePoles[0].latitude),
          lng: parseFloat(safePoles[0].longitude),
        });
      } else if (!isSuperAdmin() && user?.zone?.zone_boundary) {
        const boundary = typeof user.zone.zone_boundary === 'string'
          ? JSON.parse(user.zone.zone_boundary)
          : user.zone.zone_boundary;
        if (boundary.length > 0) {
          setMapCenter({
            lat: boundary[0].lat,
            lng: boundary[0].lng,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching poles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getZoneColor = (zoneId) => {
    const colors = ['#1976D2', '#9C27B0', '#4CAF50', '#FF9800', '#F44336', '#2196F3'];
    return colors[zoneId % colors.length];
  };

  const handleMarkerClick = (pole) => {
    setSelectedPole(pole);
  };

  return (
    <Box>
      {/* Page Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Map View
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isSuperAdmin()
            ? 'View all poles and zones across the system'
            : `View poles in your zone: ${user?.zone?.zone_name}`}
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Map */}
        <Grid item xs={12} md={9}>
          <Card>
            <CardContent>
              {mapLoadError ? (
                <Alert severity="error">
                  Error loading Google Maps. Please check your API key configuration.
                </Alert>
              ) : loadingApiKey ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 600 }}>
                  <CircularProgress />
                </Box>
              ) : !apiKey ? (
                <Alert severity="warning">
                  Google Maps API key not configured. Please configure it in Settings first.
                </Alert>
              ) : (
                <Box sx={{ height: 600, position: 'relative' }}>
                  <LoadScriptNext
                    key={apiKey}
                    googleMapsApiKey={apiKey}
                    onError={() => setMapLoadError(true)}
                  >
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={mapCenter}
                      zoom={12}
                      onLoad={() => setMapReady(true)}
                      onUnmount={() => setMapReady(false)}
                    >
                      {/* Zone Boundaries */}
                      {mapReady && showZoneBoundaries &&
                        zones.map((zone) => {
                          let boundary = zone.zone_boundary;
                          if (typeof boundary === 'string') {
                            try {
                              boundary = JSON.parse(boundary);
                            } catch (error) {
                              console.warn('Invalid zone boundary for zone:', zone.id);
                              return null;
                            }
                          }
                          const sanitizedBoundary = sanitizeBoundary(boundary);
                          if (sanitizedBoundary.length < 3) {
                            return null;
                          }
                          return (
                            <Polygon
                              key={zone.id}
                              paths={sanitizedBoundary}
                              options={{
                                fillColor: getZoneColor(zone.id),
                                fillOpacity: 0.1,
                                strokeWeight: 2,
                                strokeColor: getZoneColor(zone.id),
                                clickable: false,
                              }}
                            />
                          );
                        })}

                      {/* Pole Markers and Radius Circles */}
                      {mapReady && poles.map((pole) => (
                        <Fragment key={pole.id}>
                          {/* Restricted Radius Circle */}
                          {showRadius && isValidRadius(pole.restricted_radius) && (
                            <Circle
                              center={{
                                lat: parseFloat(pole.latitude),
                                lng: parseFloat(pole.longitude),
                              }}
                              radius={parseFloat(pole.restricted_radius)}
                              options={{
                                fillColor: '#F44336',
                                fillOpacity: 0.2,
                                strokeColor: '#F44336',
                                strokeWeight: 2,
                              }}
                            />
                          )}

                          {/* Pole Marker */}
                          <Marker
                            position={{
                              lat: parseFloat(pole.latitude),
                              lng: parseFloat(pole.longitude),
                            }}
                            onClick={() => handleMarkerClick(pole)}
                          />
                        </Fragment>
                      ))}

                      {/* Info Window */}
                      {selectedPole && (
                        <InfoWindow
                          position={{
                            lat: parseFloat(selectedPole.latitude),
                            lng: parseFloat(selectedPole.longitude),
                          }}
                          onCloseClick={() => setSelectedPole(null)}
                        >
                          <Box sx={{ p: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              {selectedPole.pole_name}
                            </Typography>
                            <Typography variant="caption" display="block">
                              <strong>Height:</strong> {selectedPole.pole_height}m
                            </Typography>
                            <Typography variant="caption" display="block">
                              <strong>Radius:</strong> {selectedPole.restricted_radius}m
                            </Typography>
                            {selectedPole.zone && (
                              <Typography variant="caption" display="block">
                                <strong>Zone:</strong> {selectedPole.zone.zone_name}
                              </Typography>
                            )}
                            {selectedPole.land_owner && (
                              <Typography variant="caption" display="block">
                                <strong>Owner:</strong> {selectedPole.land_owner.owner_name}
                              </Typography>
                            )}
                          </Box>
                        </InfoWindow>
                      )}
                    </GoogleMap>
                  </LoadScriptNext>
                  {loading && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(255,255,255,0.7)',
                        zIndex: 1,
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Controls and Legend */}
        <Grid item xs={12} md={3}>
          {/* Filters */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filters
              </Typography>

              {isSuperAdmin() && zones.length > 0 && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Zone Filter</InputLabel>
                  <Select
                    value={selectedZoneFilter}
                    onChange={(e) => setSelectedZoneFilter(e.target.value)}
                    label="Zone Filter"
                  >
                    <MenuItem value="all">All Zones</MenuItem>
                    {zones.map((zone) => (
                      <MenuItem key={zone.id} value={zone.id}>
                        {zone.zone_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={showZoneBoundaries}
                    onChange={(e) => setShowZoneBoundaries(e.target.checked)}
                  />
                }
                label="Show Zone Boundaries"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={showRadius}
                    onChange={(e) => setShowRadius(e.target.checked)}
                  />
                }
                label="Show Restricted Radius"
              />
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Total Poles:</Typography>
                <Chip label={poles.length} size="small" color="primary" />
              </Box>
              {isSuperAdmin() && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Zones:</Typography>
                  <Chip label={zones.length} size="small" color="secondary" />
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Legend
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                  Zone Boundaries:
                </Typography>
                {zones.map((zone) => (
                  <Box key={zone.id} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        bgcolor: getZoneColor(zone.id),
                        mr: 1,
                        border: '1px solid #ccc',
                      }}
                    />
                    <Typography variant="caption">{zone.zone_name}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                  Markers:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <LocationIcon sx={{ fontSize: 18, mr: 1, color: 'primary.main' }} />
                  <Typography variant="caption">Pole Location</Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                  Radius Circles:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <CancelIcon sx={{ fontSize: 18, mr: 1, color: 'error.main' }} />
                  <Typography variant="caption">Restricted Area (No Marketing)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ fontSize: 18, mr: 1, color: 'success.main' }} />
                  <Typography variant="caption">Outside Radius (Marketing Allowed)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MapView;
