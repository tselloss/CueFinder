import React, { useState } from 'react';
import { Grommet, Box, Heading, Text } from 'grommet';
import { grommet } from 'grommet/themes';
import { deepMerge } from 'grommet/utils';

import ForumNavigation from './components/ForumNavigation';
import Forum from './components/Forum';
import { AuthProvider } from './auth/AuthContext';
import './styles/forum.css';

// Customize the theme
const customTheme = deepMerge(grommet, {
  global: {
    colors: {
      brand: '#3b82f6',
      'status-ok': '#22c55e',
      'status-critical': '#ef4444',
      'status-warning': '#f59e0b',
      background: '#0f172a',
      'background-front': '#1e293b',
      'background-back': '#020617',
      text: '#e2e8f0',
      'text-weak': '#94a3b8',
      border: 'rgba(59, 130, 246, 0.2)',
    },
    font: {
      family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
    },
  },
});

const Home = () => (
  <Box fill pad="large" gap="medium" background="background">
    <Heading level="1">Welcome to CueFinder</Heading>
    <Text size="large" color="text-weak">
      A comprehensive forum and community platform for billiards enthusiasts.
    </Text>
    <Box gap="small" margin={{ top: 'medium' }}>
      <Text weight="600">Features:</Text>
      <Text color="text-weak">✓ Discussion forums by category</Text>
      <Text color="text-weak">✓ Community support and tips</Text>
      <Text color="text-weak">✓ Share your cue expertise</Text>
      <Text color="text-weak">✓ Connect with other enthusiasts</Text>
    </Box>
  </Box>
);

const Search = () => (
  <Box fill pad="large" gap="medium" background="background">
    <Heading level="2">Search Page</Heading>
    <Text color="text-weak">Search functionality coming soon...</Text>
  </Box>
);

const Profile = () => (
  <Box fill pad="large" gap="medium" background="background">
    <Heading level="2">Profile Page</Heading>
    <Text color="text-weak">Your profile and settings coming soon...</Text>
  </Box>
);

const NotFound = () => (
  <Box fill pad="large" gap="medium" background="background" justify="center" align="center">
    <Heading level="2">Page Not Found</Heading>
    <Text color="text-weak">The page you're looking for doesn't exist.</Text>
  </Box>
);

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [profileOpen, setProfileOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'forum':
        return <Forum onBack={() => setCurrentPage('home')} />;
      case 'search':
        return <Search />;
      case 'profile':
        return <Profile />;
      case 'home':
        return <Home />;
      default:
        return <NotFound />;
    }
  };

  return (
    <AuthProvider>
      <Grommet theme={customTheme} full>
        <Box fill background="background">
          {/* Navigation Header */}
          <ForumNavigation
            onNavigateTo={setCurrentPage}
            currentPage={currentPage}
            profileOpen={profileOpen}
            setProfileOpen={setProfileOpen}
          />

          {/* Page Content */}
          {renderPage()}
        </Box>
      </Grommet>
    </AuthProvider>
  );
};

export default App;
