import React from 'react';
import { Button } from './ui/button.jsx';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ComingSoon({ category, onBack }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

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
    <div className="w-full min-h-screen bg-background px-4 py-6 flex flex-col">
      <Button 
        variant="ghost" 
        onClick={handleBack}
        className="mb-6 w-fit"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <div className="flex-grow flex flex-col items-center justify-center gap-8 min-h-60vh">
        <div className="text-9xl">
          {getCategoryEmoji()}
        </div>
        
        <h2 className="text-3xl font-bold text-center">
          {getCategoryName()}
        </h2>
        
        <div className="text-center space-y-3 max-w-lg">
          <div className="text-2xl text-muted-foreground">
            Coming Soon
          </div>
          <div className="text-lg text-muted-foreground">
            We're working hard to bring you {getCategoryName()}. 
            Check back soon for exciting new listings!
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <div className="w-3 h-3 rounded-full bg-primary opacity-60" />
          <div className="w-3 h-3 rounded-full bg-primary opacity-30" />
        </div>
      </div>
    </div>
  );
}
