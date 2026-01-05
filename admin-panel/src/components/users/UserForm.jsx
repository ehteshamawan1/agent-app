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
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import userService from '../../services/userService';
import zoneService from '../../services/zoneService';

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [zones, setZones] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    mobile: '',
    role: 'admin',
    zone_id: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchZones();
    if (isEditMode) {
      fetchUser();
    }
  }, [id]);

  const fetchZones = async () => {
    try {
      const data = await zoneService.getAll();
      // Filter active zones only
      setZones(data.filter((zone) => zone.status === 'active'));
    } catch (error) {
      console.error('Error fetching zones:', error);
      toast.error('Failed to load zones');
    }
  };

  const fetchUser = async () => {
    setLoading(true);
    try {
      const data = await userService.getById(id);
      setFormData({
        name: data.name,
        email: data.email,
        password: '',
        password_confirmation: '',
        mobile: data.mobile || '',
        role: data.role,
        zone_id: data.zone_id || '',
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user');
      navigate('/users');
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

    // Clear zone if super_admin is selected
    if (name === 'role' && value === 'super_admin') {
      setFormData((prev) => ({
        ...prev,
        zone_id: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password is required for new users
    if (!isEditMode && !formData.password) {
      newErrors.password = 'Password is required';
    }

    // If password is provided, validate it
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = 'Passwords do not match';
      }
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    // Zone is required for admin and agent roles
    if ((formData.role === 'admin' || formData.role === 'agent') && !formData.zone_id) {
      newErrors.zone_id = 'Zone is required for admins and agents';
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
      const payload = { ...formData };

      // Remove zone_id if super_admin
      if (payload.role === 'super_admin') {
        delete payload.zone_id;
      }

      // Remove password fields if not provided in edit mode
      if (isEditMode && !payload.password) {
        delete payload.password;
        delete payload.password_confirmation;
      }

      if (isEditMode) {
        await userService.update(id, payload);
        toast.success('User updated successfully');
      } else {
        await userService.create(payload);
        toast.success('User created successfully');
      }

      navigate('/users');
    } catch (error) {
      console.error('Error saving user:', error);
      const message = error.response?.data?.message || 'Failed to save user';
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
            onClick={() => navigate('/users')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4">
            {isEditMode ? 'Edit User' : 'Add New User'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {isEditMode ? 'Update user information' : 'Create a new admin or agent user'}
        </Typography>
      </Paper>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="+92 300 1234567"
                />
              </Grid>

              {/* Role & Zone */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Role & Zone Assignment
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!errors.role}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    label="Role"
                  >
                    <MenuItem value="super_admin">Super Admin</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="agent">Agent</MenuItem>
                  </Select>
                  {errors.role && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.role}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl
                  fullWidth
                  required={formData.role !== 'super_admin'}
                  disabled={formData.role === 'super_admin'}
                  error={!!errors.zone_id}
                >
                  <InputLabel>Assigned Zone</InputLabel>
                  <Select
                    name="zone_id"
                    value={formData.zone_id}
                    onChange={handleChange}
                    label="Assigned Zone"
                  >
                    {zones.map((zone) => (
                      <MenuItem key={zone.id} value={zone.id}>
                        {zone.zone_name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.zone_id && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.zone_id}
                    </Typography>
                  )}
                  {formData.role === 'super_admin' && (
                    <Typography variant="caption" sx={{ mt: 0.5 }}>
                      Super Admins have access to all zones
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Password */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  {isEditMode ? 'Change Password (Leave blank to keep current)' : 'Password'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password || 'Minimum 8 characters'}
                  required={!isEditMode}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="password_confirmation"
                  type="password"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  error={!!errors.password_confirmation}
                  helperText={errors.password_confirmation}
                  required={!isEditMode || !!formData.password}
                />
              </Grid>

              {/* Alert for zone requirement */}
              {(formData.role === 'admin' || formData.role === 'agent') && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    {formData.role === 'admin'
                      ? 'Admins can only manage poles and land owners in their assigned zone.'
                      : 'Agents can only check location status within their assigned zone.'}
                  </Alert>
                </Grid>
              )}

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/users')}
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
                    {saving ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
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

export default UserForm;
