import { Box, Text } from 'grommet';

const Badge = ({ count, color = 'status-critical' }) => {
  if (!count || count === 0) return null;
  
  return (
    <Box
      background={color}
      round="full"
      pad={{ horizontal: '6px', vertical: '2px' }}
      margin={{ left: 'small' }}
      justify="center"
      align="center"
      style={{ minWidth: '20px', height: '20px' }}
    >
      <Text size="xsmall" weight="bold" color="white">
        {count}
      </Text>
    </Box>
  );
};

export default Badge;
