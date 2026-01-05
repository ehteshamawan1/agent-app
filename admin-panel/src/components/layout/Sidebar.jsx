import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Toolbar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Map as MapIcon,
  Visibility as VisibilityIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 260;

const Sidebar = ({ variant = 'permanent', open = true, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isSuperAdmin } = useAuth();

  // Menu items based on role
  const menuItems = [
    {
      title: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['super_admin', 'admin'],
    },
    {
      title: 'Zone Management',
      icon: <MapIcon />,
      path: '/zones',
      roles: ['super_admin'], // Only super admin
    },
    {
      title: 'User Management',
      icon: <PeopleIcon />,
      path: '/users',
      roles: ['super_admin'], // Only super admin
    },
    {
      title: 'Poles',
      icon: <LocationIcon />,
      path: '/poles',
      roles: ['super_admin', 'admin'],
    },
    {
      title: 'Land Owners',
      icon: <BusinessIcon />,
      path: '/land-owners',
      roles: ['super_admin', 'admin'],
    },
    {
      title: 'Line of Sight',
      icon: <VisibilityIcon />,
      path: '/line-of-sight',
      roles: ['super_admin', 'admin'],
    },
    {
      title: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
      roles: ['super_admin', 'admin'],
    },
  ];

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  const isActive = (path) => location.pathname === path;

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: '#f5f5f5',
          borderRight: '1px solid #e0e0e0',
        },
      }}
    >
      <Toolbar />

      {/* App Logo/Title */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: 'primary.main' }}
        >
          Tower Marketing
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Tracker System
        </Typography>
      </Box>

      <Divider />

      {/* User Info */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <AccountCircleIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </Typography>
          </Box>
        </Box>

        {/* Show zone for regular admins */}
        {!isSuperAdmin() && user?.zone && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.5,
              px: 1,
              py: 0.5,
              bgcolor: 'primary.light',
              color: 'white',
              borderRadius: 1,
              fontSize: '0.7rem',
            }}
          >
            Zone: {user.zone.zone_name}
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ px: 1, py: 2 }}>
        {visibleMenuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={isActive(item.path)}
              sx={{
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) ? 'white' : 'text.secondary',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: isActive(item.path) ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
export { DRAWER_WIDTH };
