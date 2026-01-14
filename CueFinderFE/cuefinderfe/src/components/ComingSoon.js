import React from 'react';
import { Box, Button, Heading, Text } from 'grommet';
import { Previous } from 'grommet-icons';

export default function ComingSoon({ category, onBack }) {
  const getCategoryEmoji = () => {
    switch(category) {
      case 'tables':
        return '🪑';
      case 'accessories':
        return '🛠️';
      default:
        return '🎱';
    }
  };

  const getCategoryName = () => {
    switch(category) {
      case 'tables':
        return 'Billiard Tables';
      case 'accessories':
        return 'Accessories';
      default:
        return 'This Section';
    }
  };

  return (
    <Box fill background="background" pad={{ horizontal: 'medium', vertical: 'medium' }}>
      <Button 
        icon={<Previous />} 
        label="Back"
        onClick={onBack}
        plain
        style={{ marginBottom: '24px' }}
      />
      
      <Box 
        align="center" 
        justify="center" 
        fill 
        gap="large"
        style={{ minHeight: '60vh' }}
      >
        <Text size="120px" style={{ lineHeight: '1' }}>
          {getCategoryEmoji()}
        </Text>
        
        <Heading level="2" textAlign="center" margin="none">
          {getCategoryName()}
        </Heading>
        
        <Box align="center" gap="small">
          <Text size="xlarge" color="text-weak" textAlign="center">
            Coming Soon
          </Text>
          <Text size="large" color="text-weak" textAlign="center" width="large">
            We're working hard to bring you {getCategoryName()}. 
            Check back soon for exciting new listings!
          </Text>
        </Box>

        <Box 
          gap="small" 
          direction="row" 
          align="center" 
          margin={{ top: 'medium' }}
        >
          <Box width="12px" height="12px" round="full" background="brand" />
          <Box width="12px" height="12px" round="full" background="brand" style={{ opacity: 0.6 }} />
          <Box width="12px" height="12px" round="full" background="brand" style={{ opacity: 0.3 }} />
        </Box>
      </Box>
    </Box>
  );
}
