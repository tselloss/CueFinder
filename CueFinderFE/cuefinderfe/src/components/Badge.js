import { Box, Text } from 'grommet';

const Badge = ({ count, color = 'status-critical', value, label, pad, round, style, background }) => {
  // Support both 'count' and 'value' props for flexibility
  const displayCount = count || value;
  
  if (!displayCount || displayCount === 0) return null;
  
  // If label is provided, display as a labeled badge
  if (label) {
    return (
      <Box
        background={background || color}
        round={round || 'small'}
        pad={pad || 'xsmall'}
        justify="center"
        align="center"
        style={style}
      >
        <Text size="xsmall" weight="bold" color="white">
          {label}
        </Text>
      </Box>
    );
  }
  
  // Display as numeric badge with pulse animation for unread messages
  return (
    <Box
      background={background || color}
      round={round || 'full'}
      pad={pad || { horizontal: '8px', vertical: '4px' }}
      justify="center"
      align="center"
      style={{
        minWidth: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'pulse 2s infinite',
        ...style
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
      <Text size="xsmall" weight="bold" color="white" style={{ lineHeight: '1' }}>
        {displayCount > 99 ? '99+' : displayCount}
      </Text>
    </Box>
  );
};

export default Badge;
