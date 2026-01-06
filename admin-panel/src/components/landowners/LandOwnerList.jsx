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
  Phone as PhoneIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import landOwnerService from '../../services/landOwnerService';
import zoneService from '../../services/zoneService';
import { useAuth } from '../../context/AuthContext';

const LandOwnerList = () => {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const [landOwners, setLandOwners] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('all');
  const [notesFilter, setNotesFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLandOwners();
    if (isSuperAdmin()) {
      fetchZones();
    }
  }, []);

  const fetchZones = async () => {
    try {
      const data = await zoneService.getAll();
      setZones(data.filter((zone) => zone.status === 'active'));
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  const fetchLandOwners = async () => {
    setLoading(true);
    try {
      const data = await landOwnerService.getAll();
      setLandOwners(data);
    } catch (error) {
      console.error('Error fetching land owners:', error);
      toast.error('Failed to load land owners');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (owner) => {
    setSelectedOwner(owner);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await landOwnerService.delete(selectedOwner.id);
      toast.success('Land owner deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedOwner(null);
      fetchLandOwners();
    } catch (error) {
      console.error('Error deleting land owner:', error);
      const message = error.response?.data?.message || 'Failed to delete land owner. May be assigned to poles.';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredLandOwners = landOwners.filter((owner) => {
    if (isSuperAdmin() && selectedZoneFilter !== 'all' && owner.zone_id !== parseInt(selectedZoneFilter)) {
      return false;
    }

    if (notesFilter === 'with_notes' && !owner.notes) {
      return false;
    }

    if (notesFilter === 'without_notes' && owner.notes) {
      return false;
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return true;
    }

    const searchableFields = [
      owner.owner_name,
      owner.mobile_number,
      owner.address,
      owner.notes,
      owner.zone?.zone_name,
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
              Land Owner Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isSuperAdmin()
                ? 'Manage land owners across all zones'
                : `Manage land owners in your zone: ${user?.zone?.zone_name}`}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/land-owners/create')}
            size="large"
          >
            Add Land Owner
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
              placeholder="Search land owners, phones, addresses, or notes..."
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
                  <MenuItem value="all">All Zones ({landOwners.length})</MenuItem>
                  {zones.map((zone) => (
                    <MenuItem key={zone.id} value={zone.id}>
                      {zone.zone_name} ({landOwners.filter((o) => o.zone_id === zone.id).length})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Notes</InputLabel>
              <Select
                value={notesFilter}
                onChange={(e) => setNotesFilter(e.target.value)}
                label="Filter by Notes"
              >
                <MenuItem value="all">All Records ({landOwners.length})</MenuItem>
                <MenuItem value="with_notes">
                  With Notes ({landOwners.filter((o) => o.notes).length})
                </MenuItem>
                <MenuItem value="without_notes">
                  Without Notes ({landOwners.filter((o) => !o.notes).length})
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Land Owners Table */}
      <Card>
        <CardContent>
          {filteredLandOwners.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                {landOwners.length === 0
                  ? 'No land owners found. Add your first land owner to get started.'
                  : 'No land owners match the current filters.'}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Owner Name</strong></TableCell>
                    <TableCell><strong>Mobile Number</strong></TableCell>
                    <TableCell><strong>Address</strong></TableCell>
                    <TableCell><strong>Notes</strong></TableCell>
                    {isSuperAdmin() && <TableCell><strong>Zone</strong></TableCell>}
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLandOwners.map((owner) => (
                    <TableRow key={owner.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {owner.owner_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">{owner.mobile_number}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {owner.address}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {owner.notes || 'N/A'}
                        </Typography>
                      </TableCell>
                      {isSuperAdmin() && (
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {owner.zone?.zone_name || 'N/A'}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/land-owners/edit/${owner.id}`)}
                          title="Edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(owner)}
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
        <DialogTitle>Delete Land Owner</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedOwner?.owner_name}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Note: You cannot delete a land owner that is assigned to any poles.
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

export default LandOwnerList;
