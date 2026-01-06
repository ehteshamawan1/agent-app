import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import zoneService from '../../services/zoneService';

const ZoneList = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const data = await zoneService.getAll();
      setZones(data);
    } catch (error) {
      console.error('Error fetching zones:', error);
      toast.error('Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (zone) => {
    try {
      await zoneService.toggleStatus(zone.id);
      toast.success(`Zone ${zone.status === 'active' ? 'deactivated' : 'activated'}`);
      fetchZones();
    } catch (error) {
      console.error('Error toggling zone status:', error);
      toast.error('Failed to update zone status');
    }
  };

  const handleDeleteClick = (zone) => {
    setSelectedZone(zone);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await zoneService.delete(selectedZone.id);
      toast.success('Zone deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedZone(null);
      fetchZones();
    } catch (error) {
      console.error('Error deleting zone:', error);
      const message = error.response?.data?.message || 'Failed to delete zone. It may have assigned users or poles.';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredZones = zones.filter((zone) => {
    if (statusFilter !== 'all' && zone.status !== statusFilter) {
      return false;
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return true;
    }

    const searchableFields = [
      zone.zone_name,
      zone.description,
      zone.creator?.name,
    ]
      .filter(Boolean)
      .map((value) => value.toString().toLowerCase());

    return searchableFields.some((value) => value.includes(normalizedSearch));
  });

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Zone Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create and manage geographic zones for admins and agents
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/zones/create')}
            size="large"
          >
            Create Zone
          </Button>
        </Box>
      </Paper>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search zones, descriptions, or creators..."
              label="Search"
              sx={{ minWidth: 260, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="all">All Statuses ({zones.length})</MenuItem>
                <MenuItem value="active">
                  Active ({zones.filter((zone) => zone.status === 'active').length})
                </MenuItem>
                <MenuItem value="inactive">
                  Inactive ({zones.filter((zone) => zone.status === 'inactive').length})
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Zones Table */}
      <Card>
        <CardContent>
          {filteredZones.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                {zones.length === 0
                  ? 'No zones created yet. Create your first zone to get started.'
                  : 'No zones match the current filters.'}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Zone Name</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Assigned Users</strong></TableCell>
                    <TableCell><strong>Created By</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredZones.map((zone) => (
                    <TableRow key={zone.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {zone.zone_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {zone.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={zone.status}
                          color={zone.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<PeopleIcon />}
                          label={zone.users_count || 0}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {zone.creator?.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/zones/view/${zone.id}`)}
                          title="View Details"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleStatus(zone)}
                          title={zone.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {zone.status === 'active' ? (
                            <ToggleOnIcon color="success" />
                          ) : (
                            <ToggleOffIcon color="disabled" />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/zones/edit/${zone.id}`)}
                          title="Edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(zone)}
                          title="Delete"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Zone</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the zone <strong>{selectedZone?.zone_name}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Note: You cannot delete a zone that has assigned users or poles.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ZoneList;
