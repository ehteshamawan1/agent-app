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
  TablePagination,
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
  Map as MapIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import poleService from '../../services/poleService';
import zoneService from '../../services/zoneService';
import { useAuth } from '../../context/AuthContext';

const PoleList = () => {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const [poles, setPoles] = useState([]);
  const [filteredPoles, setFilteredPoles] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPole, setSelectedPole] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (isSuperAdmin()) {
      fetchZones();
    }
    fetchPoles();
  }, []);

  useEffect(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const result = poles.filter((pole) => {
      if (selectedZoneFilter !== 'all' && pole.zone_id !== parseInt(selectedZoneFilter)) {
        return false;
      }

      if (selectedStatusFilter !== 'all' && pole.status !== selectedStatusFilter) {
        return false;
      }

      if (selectedOwnerFilter !== 'all') {
        const hasOwner = !!pole.land_owner_id || !!pole.land_owner;
        if (selectedOwnerFilter === 'assigned' && !hasOwner) {
          return false;
        }
        if (selectedOwnerFilter === 'unassigned' && hasOwner) {
          return false;
        }
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableFields = [
        pole.pole_name,
        pole.land_owner?.owner_name,
        pole.zone?.zone_name,
        pole.latitude,
        pole.longitude,
      ]
        .filter(Boolean)
        .map((value) => value.toString().toLowerCase());

      return searchableFields.some((value) => value.includes(normalizedSearch));
    });

    setFilteredPoles(result);
    setPage(0);
  }, [selectedZoneFilter, selectedStatusFilter, selectedOwnerFilter, searchTerm, poles]);

  const fetchZones = async () => {
    try {
      const data = await zoneService.getAll();
      setZones(data.filter((zone) => zone.status === 'active'));
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  const fetchPoles = async () => {
    setLoading(true);
    try {
      const data = await poleService.getAll();
      setPoles(data);
      setFilteredPoles(data);
    } catch (error) {
      console.error('Error fetching poles:', error);
      toast.error('Failed to load poles');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleToggleStatus = async (pole) => {
    try {
      await poleService.toggleStatus(pole.id);
      toast.success(`Pole ${pole.status === 'active' ? 'deactivated' : 'activated'}`);
      fetchPoles();
    } catch (error) {
      console.error('Error toggling pole status:', error);
      toast.error('Failed to update pole status');
    }
  };

  const handleDeleteClick = (pole) => {
    setSelectedPole(pole);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await poleService.delete(selectedPole.id);
      toast.success('Pole deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedPole(null);
      fetchPoles();
    } catch (error) {
      console.error('Error deleting pole:', error);
      const message = error.response?.data?.message || 'Failed to delete pole';
      toast.error(message);
    } finally {
      setDeleting(false);
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Pole Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isSuperAdmin()
                ? 'Manage poles across all zones'
                : `Manage poles in your zone: ${user?.zone?.zone_name}`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<MapIcon />}
              onClick={() => navigate('/poles/map')}
            >
              View Map
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/poles/create')}
              size="large"
            >
              Add Pole
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search poles, owners, zones, or coordinates..."
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
            {isSuperAdmin() && zones.length > 0 && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Zone</InputLabel>
                <Select
                  value={selectedZoneFilter}
                  onChange={(e) => setSelectedZoneFilter(e.target.value)}
                  label="Filter by Zone"
                >
                  <MenuItem value="all">All Zones ({poles.length})</MenuItem>
                  {zones.map((zone) => (
                    <MenuItem key={zone.id} value={zone.id}>
                      {zone.zone_name} ({poles.filter((p) => p.zone_id === zone.id).length})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="all">All Statuses ({poles.length})</MenuItem>
                <MenuItem value="active">
                  Active ({poles.filter((p) => p.status === 'active').length})
                </MenuItem>
                <MenuItem value="inactive">
                  Inactive ({poles.filter((p) => p.status === 'inactive').length})
                </MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Filter by Land Owner</InputLabel>
              <Select
                value={selectedOwnerFilter}
                onChange={(e) => setSelectedOwnerFilter(e.target.value)}
                label="Filter by Land Owner"
              >
                <MenuItem value="all">All Poles ({poles.length})</MenuItem>
                <MenuItem value="assigned">
                  Assigned ({poles.filter((p) => p.land_owner_id || p.land_owner).length})
                </MenuItem>
                <MenuItem value="unassigned">
                  Unassigned ({poles.filter((p) => !p.land_owner_id && !p.land_owner).length})
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Poles Table */}
      <Card>
        <CardContent>
          {filteredPoles.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                {selectedZoneFilter !== 'all'
                  ? 'No poles found in this zone.'
                  : 'No poles found. Add your first pole to get started.'}
              </Typography>
            </Box>
          ) : (
            <><TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Pole Name</strong></TableCell>
                    <TableCell><strong>Location</strong></TableCell>
                    <TableCell><strong>Height (m)</strong></TableCell>
                    <TableCell><strong>Radius (m)</strong></TableCell>
                    <TableCell><strong>Land Owner</strong></TableCell>
                    {isSuperAdmin() && <TableCell><strong>Zone</strong></TableCell>}
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPoles
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((pole) => (
                    <TableRow key={pole.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {pole.pole_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {parseFloat(pole.latitude).toFixed(6)}, {parseFloat(pole.longitude).toFixed(6)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{pole.pole_height}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={pole.restricted_radius}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {pole.land_owner?.owner_name || 'Not assigned'}
                        </Typography>
                      </TableCell>
                      {isSuperAdmin() && (
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {pole.zone?.zone_name || 'N/A'}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell>
                        <Chip
                          label={pole.status}
                          color={pole.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleToggleStatus(pole)}
                          title={pole.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {pole.status === 'active' ? (
                            <ToggleOnIcon color="success" />
                          ) : (
                            <ToggleOffIcon color="disabled" />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/poles/edit/${pole.id}`)}
                          title="Edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(pole)}
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
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredPoles.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Pole</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the pole <strong>{selectedPole?.pole_name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This action cannot be undone.
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

export default PoleList;
