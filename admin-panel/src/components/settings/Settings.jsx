import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Check as CheckIcon,
  Science as TestIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import settingsService from '../../services/settingsService';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [settings, setSettings] = useState({
    google_maps_api_key: '',
    app_name: '',
    support_email: '',
    support_phone: '',
    default_pole_radius: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getAll();

      // Convert array of settings to object
      const settingsObj = {};
      data.forEach((setting) => {
        settingsObj[setting.key] = setting.value || '';
      });

      setSettings(settingsObj);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    // Clear error for this field
    setErrors((prev) => ({
      ...prev,
      [key]: '',
    }));
  };

  const validateSettings = () => {
    const newErrors = {};

    // Validate Google Maps API Key
    if (!settings.google_maps_api_key || settings.google_maps_api_key.trim() === '') {
      newErrors.google_maps_api_key = 'Google Maps API Key is required';
    }

    // Validate email format if provided
    if (settings.support_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.support_email)) {
      newErrors.support_email = 'Invalid email format';
    }

    // Validate default radius if provided
    if (settings.default_pole_radius) {
      const radius = parseFloat(settings.default_pole_radius);
      if (isNaN(radius) || radius < 50 || radius > 5000) {
        newErrors.default_pole_radius = 'Radius must be between 50 and 5000 meters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestApiKey = async () => {
    if (!settings.google_maps_api_key || settings.google_maps_api_key.trim() === '') {
      toast.error('Please enter an API key first');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Test the API key by making a simple Geocoding API request
      const testAddress = 'Lahore, Pakistan';
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          testAddress
        )}&key=${settings.google_maps_api_key}`
      );

      const data = await response.json();

      if (data.status === 'OK') {
        setTestResult({ success: true, message: 'API key is valid and working!' });
        toast.success('API key test successful!');
      } else if (data.status === 'REQUEST_DENIED') {
        setTestResult({
          success: false,
          message: `API key test failed: ${data.error_message || 'Request denied. Check API key permissions.'}`,
        });
        toast.error('API key is invalid or restricted');
      } else {
        setTestResult({
          success: false,
          message: `API key test failed: ${data.error_message || data.status}`,
        });
        toast.error('API key test failed');
      }
    } catch (error) {
      console.error('Error testing API key:', error);
      setTestResult({
        success: false,
        message: 'Network error while testing API key',
      });
      toast.error('Failed to test API key');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      toast.error('Please fix validation errors');
      return;
    }

    setSaving(true);
    try {
      // Update each setting
      const updatePromises = Object.entries(settings).map(([key, value]) => {
        if (value !== '') {
          return settingsService.update(key, value);
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);

      toast.success('Settings saved successfully');
      fetchSettings(); // Refresh settings
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
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
        <Typography variant="h4" gutterBottom>
          System Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure system-wide settings including Google Maps API key and other options
        </Typography>
      </Paper>

      {/* Settings Form */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 1100 }}>
          <Grid container spacing={3}>
        {/* Google Maps API Key Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Google Maps Configuration
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Alert severity="info" sx={{ mb: 2 }}>
                This API key is used for Maps, Elevation API, and all location services.
                You can change this key anytime without rebuilding the application.
              </Alert>

              <TextField
                fullWidth
                label="Google Maps API Key"
                value={settings.google_maps_api_key}
                onChange={(e) => {
                  handleChange('google_maps_api_key', e.target.value);
                  setTestResult(null); // Clear test result when key changes
                }}
                error={!!errors.google_maps_api_key}
                helperText={errors.google_maps_api_key || 'Required for all map and location features'}
                placeholder="AIzaSy..."
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={testing ? <CircularProgress size={20} /> : <TestIcon />}
                  onClick={handleTestApiKey}
                  disabled={testing || !settings.google_maps_api_key}
                >
                  {testing ? 'Testing...' : 'Test API Key'}
                </Button>
              </Box>

              {testResult && (
                <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                  {testResult.message}
                </Alert>
              )}

              {settings.google_maps_api_key && !testResult && (
                <Alert severity="success" icon={<CheckIcon />}>
                  API Key is configured
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* General Settings Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                General Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Application Name"
                    value={settings.app_name}
                    onChange={(e) => handleChange('app_name', e.target.value)}
                    placeholder="Tower Marketing Tracker"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Default Pole Radius (meters)"
                    type="number"
                    value={settings.default_pole_radius}
                    onChange={(e) => handleChange('default_pole_radius', e.target.value)}
                    error={!!errors.default_pole_radius}
                    helperText={errors.default_pole_radius || 'Between 50 and 5000 meters'}
                    placeholder="500"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Support Email"
                    type="email"
                    value={settings.support_email}
                    onChange={(e) => handleChange('support_email', e.target.value)}
                    error={!!errors.support_email}
                    helperText={errors.support_email}
                    placeholder="support@example.com"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Support Phone"
                    value={settings.support_phone}
                    onChange={(e) => handleChange('support_phone', e.target.value)}
                    placeholder="+92 300 1234567"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default Settings;
