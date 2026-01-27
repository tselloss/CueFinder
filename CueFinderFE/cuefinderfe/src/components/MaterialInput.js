import React from 'react';
import { Input } from './ui/input.jsx';

// Minimal wrapper to satisfy legacy imports
export default function MaterialInput(props) {
  return <Input {...props} />;
}
