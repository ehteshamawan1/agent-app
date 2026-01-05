import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { DRAWER_WIDTH } from './Sidebar';
import { useState } from 'react';
import { toast } from 'react-toastify';

const Header = ({ isMobile, onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
    handleMenuClose();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
        bgcolor: 'white',
        color: 'text.primary',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Page Title / Breadcrumb */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {/* This can be made dynamic based on current route */}
        </Typography>

        {/* User Zone Info (for regular admins) */}
        {!isSuperAdmin() && user?.zone && (
          <Box
            sx={{
              mr: 2,
              px: 2,
              py: 0.5,
              bgcolor: 'primary.light',
              color: 'white',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              Zone: {user.zone.zone_name}
            </Typography>
          </Box>
        )}

        {/* User Menu */}
        <Box>
          <IconButton
            size="large"
            onClick={handleMenuOpen}
            color="inherit"
            sx={{ ml: 1 }}
          >
            <AccountCircleIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </Typography>
            </Box>

            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
