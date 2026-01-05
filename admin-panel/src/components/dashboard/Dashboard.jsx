import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Map as MapIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  AddLocation as AddLocationIcon,
  Edit as EditIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';
import poleService from '../../services/poleService';
import userService from '../../services/userService';
import zoneService from '../../services/zoneService';
import landOwnerService from '../../services/landOwnerService';

const Dashboard = () => {
  const { user, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPoles: 0,
    activePoles: 0,
    totalLandOwners: 0,
    totalZones: 0,
    totalUsers: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [poles, users, zones, landOwners] = await Promise.all([
        poleService.getAll().catch(() => []),
        isSuperAdmin() ? userService.getAll().catch(() => []) : Promise.resolve([]),
        isSuperAdmin() ? zoneService.getAll().catch(() => []) : Promise.resolve([]),
        landOwnerService.getAll().catch(() => []),
      ]);

      // Calculate statistics
      const activePoles = poles.filter((p) => p.status === 'active');
      setStats({
        totalPoles: poles.length,
        activePoles: activePoles.length,
        totalLandOwners: landOwners.length,
        totalZones: zones.length,
        totalUsers: users.length,
      });

      // Generate recent activities from the data
      const activities = [];

      // Add recent poles (last 5)
      const recentPoles = poles
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);
      recentPoles.forEach((pole) => {
        activities.push({
          id: `pole-${pole.id}`,
          type: 'pole_added',
          icon: <AddLocationIcon />,
          color: 'success',
          title: 'New Pole Added',
          description: `${pole.pole_name} was added to ${pole.zone?.zone_name || 'the system'}`,
          timestamp: pole.created_at,
        });
      });

      // Add recent users (last 3) - Super Admin only
      if (isSuperAdmin() && users.length > 0) {
        const recentUsers = users
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 2);
        recentUsers.forEach((usr) => {
          activities.push({
            id: `user-${usr.id}`,
            type: 'user_added',
            icon: <PersonAddIcon />,
            color: 'primary',
            title: 'New User Created',
            description: `${usr.name} (${usr.role}) was added to the system`,
            timestamp: usr.created_at,
          });
        });
      }

      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setRecentActivities(activities.slice(0, 8)); // Show max 8 activities
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Recently';

    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return time.toLocaleDateString();
  };

  const StatCard = ({ icon, title, value, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              borderRadius: 2,
              p: 1.5,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Welcome Section */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.name}!
        </Typography>
        <Typography variant="body1">
          {isSuperAdmin()
            ? 'You have full access to all system features and zones.'
            : `You are managing: ${user?.zone?.zone_name || 'No zone assigned'}`}
        </Typography>
      </Paper>

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 1100 }}>
          <Grid container spacing={3}>
          {/* Show different stats based on role */}
          {isSuperAdmin() && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  icon={<MapIcon />}
                  title="Total Zones"
                  value={stats.totalZones}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  icon={<PeopleIcon />}
                  title="Total Users"
                  value={stats.totalUsers}
                  color="secondary"
                />
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<LocationIcon />}
              title={isSuperAdmin() ? 'Total Poles' : 'Poles in Your Zone'}
              value={stats.totalPoles}
              color="success"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<LocationIcon />}
              title="Active Poles"
              value={stats.activePoles}
              color="info"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<BusinessIcon />}
              title={isSuperAdmin() ? 'Total Land Owners' : 'Land Owners in Zone'}
              value={stats.totalLandOwners}
              color="warning"
            />
          </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Recent Activities */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
        <Box sx={{ width: '100%', maxWidth: 1100 }}>
          <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : recentActivities.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No recent activities. Start by adding poles or managing zones.
              </Typography>
            ) : (
              <List>
                {recentActivities.map((activity, index) => (
                  <Box key={activity.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `${activity.color}.light`, color: `${activity.color}.main` }}>
                          {activity.icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {activity.title}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {activity.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {getRelativeTime(activity.timestamp)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Use the sidebar to navigate to different modules:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Manage Poles and Locations" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Track Land Owners" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• View Map Visualizations" />
              </ListItem>
              {isSuperAdmin() && (
                <>
                  <ListItem>
                    <ListItemText primary="• Manage Zones and Users" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Configure System Settings" />
                  </ListItem>
                </>
              )}
            </List>
          </Paper>
        </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
