import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { GoogleMap, LoadScript, Polygon } from '@react-google-maps/api';
import zoneService from '../../services/zoneService';
import settingsService from '../../services/settingsService';
import { toast } from 'react-toastify';

const ZoneDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [zone, setZone] = useState(null);
  const [users, setUsers] = useState([]);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    fetchApiKey();
    fetchZone();
    fetchZoneUsers();
  }, [id]);

  const fetchApiKey = async () => {
    try {
      const key = await settingsService.getGoogleMapsApiKey();
      setApiKey(key);
    } catch (error) {
      console.error('Error fetching API key:', error);
    }
  };

  const fetchZone = async () => {
    setLoading(true);
    try {
      const data = await zoneService.getById(id);
      setZone(data);
    } catch (error) {
      console.error('Error fetching zone:', error);
      toast.error('Failed to load zone');
      navigate('/zones');
    } finally {
      setLoading(false);
    }
  };

  const fetchZoneUsers = async () => {
    try {
      const data = await zoneService.getZoneUsers(id);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching zone users:', error);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'agent':
        return 'Agent';
      default:
        return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'error';
      case 'admin':
        return 'primary';
      case 'agent':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!zone) {
    return (
      <Box>
        <Alert severity="error">Zone not found</Alert>
      </Box>
    );
  }

  const boundary =
    typeof zone.zone_boundary === 'string'
      ? JSON.parse(zone.zone_boundary)
      : zone.zone_boundary;

  const mapCenter = boundary.length > 0 ? boundary[0] : { lat: 31.5204, lng: 74.3587 };

  return (
    <Box>
      {/* Page Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/zones')}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <Box>
              <Typography variant="h4" gutterBottom>
                {zone.zone_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {zone.description || 'No description'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip
              label={zone.status}
              color={zone.status === 'active' ? 'success' : 'default'}
            />
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/zones/edit/${zone.id}`)}
            >
              Edit Zone
            </Button>
          </Box>
        </Box>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 360px' },
          gap: 3,
        }}
      >
        {/* Zone Map */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Zone Boundary
              </Typography>
              {!apiKey ? (
                <Alert severity="warning">
                  Google Maps API key not configured. Please configure it in Settings first.
                </Alert>
              ) : (
                <Box sx={{ minHeight: 520, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <LoadScript googleMapsApiKey={apiKey}>
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '520px' }}
                      center={mapCenter}
                      zoom={12}
                    >
                      <Polygon
                        paths={boundary}
                        options={{
                          fillColor: '#1976D2',
                          fillOpacity: 0.3,
                          strokeWeight: 2,
                          strokeColor: '#1976D2',
                          clickable: false,
                        }}
                      />
                    </GoogleMap>
                  </LoadScript>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Zone Information */}
        <Box>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Zone Information
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Zone Name
                </Typography>
                <Typography variant="body2">{zone.zone_name}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body2">
                  {zone.description || 'No description'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={zone.status}
                    color={zone.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Boundary Points
                </Typography>
                <Typography variant="body2">{boundary.length} points</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Created By
                </Typography>
                <Typography variant="body2">
                  {zone.creator?.name || 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Assigned Users</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Users: <strong>{users.length}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Admins: <strong>{users.filter((u) => u.role === 'admin').length}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Agents: <strong>{users.filter((u) => u.role === 'agent').length}</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Assigned Users Table */}
      <Card>
        <CardContent>
            <Typography variant="h6" gutterBottom>
              Users in This Zone
            </Typography>

              {users.length === 0 ? (
                <Alert severity="info">No users assigned to this zone yet.</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Email</strong></TableCell>
                        <TableCell><strong>Role</strong></TableCell>
                        <TableCell><strong>Mobile</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {user.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{user.email}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getRoleLabel(user.role)}
                              color={getRoleColor(user.role)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{user.mobile || 'N/A'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.status}
                              color={user.status === 'active' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ZoneDetail;
