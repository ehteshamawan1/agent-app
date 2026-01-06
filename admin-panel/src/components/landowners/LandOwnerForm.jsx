import { useState, useEffect } from 'react';
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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import landOwnerService from '../../services/landOwnerService';
import zoneService from '../../services/zoneService';
import { useAuth } from '../../context/AuthContext';

const LandOwnerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { user, isSuperAdmin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [zones, setZones] = useState([]);
  const [formData, setFormData] = useState({
    owner_name: '',
    mobile_number: '',
    address: '',
    notes: '',
    zone_id: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isSuperAdmin()) {
      fetchZones();
    }
    if (isEditMode) {
      fetchLandOwner();
    } else if (!isSuperAdmin() && user?.zone_id) {
      setFormData((prev) => ({
        ...prev,
        zone_id: user.zone_id,
      }));
    }
  }, [id]);

  const fetchZones = async () => {
    try {
      const data = await zoneService.getAll();
      setZones(data.filter((zone) => zone.status === 'active'));
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  const fetchLandOwner = async () => {
    setLoading(true);
    try {
      const data = await landOwnerService.getById(id);
      setFormData({
        owner_name: data.owner_name,
        mobile_number: data.mobile_number,
        address: data.address,
        notes: data.notes || '',
        zone_id: data.zone_id || '',
      });
    } catch (error) {
      console.error('Error fetching land owner:', error);
      toast.error('Failed to load land owner');
      navigate('/land-owners');
    } finally {
      setLoading(false);
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
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.owner_name.trim()) {
      newErrors.owner_name = 'Owner name is required';
    }

    if (isSuperAdmin() && !formData.zone_id) {
      newErrors.zone_id = 'Zone is required for super admin';
    }

    if (!formData.mobile_number.trim()) {
      newErrors.mobile_number = 'Mobile number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
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
        notes: formData.notes || null,
        zone_id: isSuperAdmin() ? parseInt(formData.zone_id, 10) : user?.zone_id,
      };

      if (isEditMode) {
        await landOwnerService.update(id, payload);
        toast.success('Land owner updated successfully');
      } else {
        await landOwnerService.create(payload);
        toast.success('Land owner created successfully');
      }

      navigate('/land-owners');
    } catch (error) {
      console.error('Error saving land owner:', error);
      const message = error.response?.data?.message || 'Failed to save land owner';
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
            onClick={() => navigate('/land-owners')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4">
            {isEditMode ? 'Edit Land Owner' : 'Add New Land Owner'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {isSuperAdmin()
            ? 'Add or edit land owner information'
            : `Adding land owner to zone: ${user?.zone?.zone_name}`}
        </Typography>
      </Paper>

      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Land Owner Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Owner Name"
                  name="owner_name"
                  value={formData.owner_name}
                  onChange={handleChange}
                  error={!!errors.owner_name}
                  helperText={errors.owner_name}
                  required
                  placeholder="e.g., Muhammad Ahmed"
                />
              </Grid>

              {isSuperAdmin() && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.zone_id}>
                    <InputLabel>Zone</InputLabel>
                    <Select
                      name="zone_id"
                      value={formData.zone_id}
                      onChange={handleChange}
                      label="Zone"
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
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  error={!!errors.mobile_number}
                  helperText={errors.mobile_number}
                  required
                  placeholder="e.g., +92 300 1234567"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={!!errors.address}
                  helperText={errors.address}
                  required
                  multiline
                  rows={2}
                  placeholder="e.g., House 123, Street 5, Lahore"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes (Optional)"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  placeholder="e.g., Paid till December 2025"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/land-owners')}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : isEditMode ? 'Update Land Owner' : 'Create Land Owner'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LandOwnerForm;
