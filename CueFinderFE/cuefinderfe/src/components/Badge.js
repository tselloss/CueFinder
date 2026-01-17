const Badge = ({ count, color = 'bg-red-500', value, label, pad, round, style, background }) => {
  // Support both 'count' and 'value' props for flexibility
  const displayCount = count || value;
  
  if (!displayCount || displayCount === 0) return null;
  
  // Map Grommet color names to Tailwind classes
  const colorMap = {
    'status-critical': 'bg-red-500',
    'status-warning': 'bg-yellow-500',
    'status-ok': 'bg-green-500',
    'status-info': 'bg-blue-500',
    'light-4': 'bg-gray-200',
  };
  
  const bgClass = colorMap[background] || background || color || 'bg-red-500';
  
  // If label is provided, display as a labeled badge
  if (label) {
    return (
      <span
        className={`${bgClass} text-white text-xs font-bold rounded-sm px-2 py-1 inline-flex items-center justify-center`}
        style={style}
      >
        {label}
      </span>
    );
  }
  
  // Display as numeric badge with pulse animation for unread messages
  return (
    <span
      className={`${bgClass} text-white text-xs font-bold rounded-full inline-flex items-center justify-center animate-pulse`}
      style={{
        minWidth: '24px',
        height: '24px',
        ...style
      }}
    >
      {displayCount > 99 ? '99+' : displayCount}
    </span>
  );
};

export default Badge;
