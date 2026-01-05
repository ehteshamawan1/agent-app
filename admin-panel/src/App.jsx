import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import Settings from './components/settings/Settings';
import Zones from './components/zones/Zones';
import Users from './components/users/Users';
import Poles from './components/poles/Poles';
import LandOwners from './components/landowners/LandOwners';
import LineOfSight from './components/lineofsight/LineOfSight';
import MapView from './components/map/MapView';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976D2', // Material Blue
      light: '#42A5F5',
      dark: '#1565C0',
    },
    secondary: {
      main: '#9C27B0', // Purple
    },
    success: {
      main: '#4CAF50', // Material Green
    },
    error: {
      main: '#F44336', // Material Red
    },
    warning: {
      main: '#FF9800', // Orange
    },
    info: {
      main: '#2196F3', // Light Blue
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Route - Login */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireRole={['super_admin', 'admin']}>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Zone Management (Super Admin Only) */}
            <Route
              path="/zones/*"
              element={
                <ProtectedRoute requireRole="super_admin">
                  <Layout>
                    <Zones />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* User Management (Super Admin Only) */}
            <Route
              path="/users/*"
              element={
                <ProtectedRoute requireRole="super_admin">
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Pole Management */}
            <Route
              path="/poles/*"
              element={
                <ProtectedRoute requireRole={['super_admin', 'admin']}>
                  <Layout>
                    <Poles />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Land Owner Management */}
            <Route
              path="/land-owners/*"
              element={
                <ProtectedRoute requireRole={['super_admin', 'admin']}>
                  <Layout>
                    <LandOwners />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Line of Sight Calculator */}
            <Route
              path="/line-of-sight"
              element={
                <ProtectedRoute requireRole={['super_admin', 'admin']}>
                  <Layout>
                    <LineOfSight />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute requireRole={['super_admin', 'admin']}>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Default Route - Redirect to Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch-all Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>

        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
