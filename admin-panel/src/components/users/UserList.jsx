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
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import userService from '../../services/userService';
import zoneService from '../../services/zoneService';

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filterTab, setFilterTab] = useState('all'); // all, super_admin, admin, agent
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
    fetchZones();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const data = await zoneService.getAll();
      setZones(data.filter((zone) => zone.status === 'active'));
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await userService.toggleStatus(user.id);
      toast.success(`User ${user.status === 'active' ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await userService.delete(selectedUser.id);
      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      const message = error.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    } finally {
      setDeleting(false);
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

  const filteredUsers = users.filter((user) => {
    // Filter by role
    if (filterTab !== 'all' && user.role !== filterTab) {
      return false;
    }

    // Filter by zone
    if (selectedZoneFilter !== 'all') {
      if (selectedZoneFilter === 'unassigned') {
        return !user.zone_id;
      }
      return user.zone_id === parseInt(selectedZoneFilter);
    }

    return true;
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
              User Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage admins and agents (Super Admin only feature)
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/users/create')}
            size="large"
          >
            Add User
          </Button>
        </Box>
      </Paper>

      {/* Filter Tabs */}
      <Card sx={{ mb: 2 }}>
        <Tabs
          value={filterTab}
          onChange={(e, newValue) => setFilterTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={`All Users (${users.length})`} value="all" />
          <Tab
            label={`Super Admins (${users.filter((u) => u.role === 'super_admin').length})`}
            value="super_admin"
          />
          <Tab
            label={`Admins (${users.filter((u) => u.role === 'admin').length})`}
            value="admin"
          />
          <Tab
            label={`Agents (${users.filter((u) => u.role === 'agent').length})`}
            value="agent"
          />
        </Tabs>
      </Card>

      {/* Zone Filter */}
      {zones.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Zone</InputLabel>
              <Select
                value={selectedZoneFilter}
                onChange={(e) => setSelectedZoneFilter(e.target.value)}
                label="Filter by Zone"
              >
                <MenuItem value="all">All Zones ({users.length})</MenuItem>
                <MenuItem value="unassigned">
                  Unassigned ({users.filter((u) => !u.zone_id).length})
                </MenuItem>
                {zones.map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>
                    {zone.zone_name} ({users.filter((u) => u.zone_id === zone.id).length})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No users found in this category.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Mobile</strong></TableCell>
                    <TableCell><strong>Role</strong></TableCell>
                    <TableCell><strong>Zone</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
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
                        <Typography variant="body2">{user.mobile || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleLabel(user.role)}
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {user.zone?.zone_name || 'All Zones'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          color={user.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleToggleStatus(user)}
                          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {user.status === 'active' ? (
                            <ToggleOnIcon color="success" />
                          ) : (
                            <ToggleOffIcon color="disabled" />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/users/edit/${user.id}`)}
                          title="Edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(user)}
                          title="Delete"
                          color="error"
                          disabled={user.role === 'super_admin'}
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
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user <strong>{selectedUser?.name}</strong>?
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

export default UserList;
