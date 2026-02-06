import React from 'react';
import { MessageCircle, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button.jsx';

/**
 * ForumHeader - Main forum header with title and actions
 * @component
 * @param {Object} user - Current user object
 * @param {Function} onBack - Callback to go back
 * @param {Function} onNewDiscussion - Callback to open new discussion modal
 */
export default function ForumHeader({ user, onBack, onNewDiscussion }) {
  return (
    <div className="sticky top-0 z-10 bg-slate-900/95 border-b border-blue-500/30 backdrop-blur-sm shadow-lg">
      <div className="px-4 sm:px-8 py-4 sm:py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 flex-wrap max-w-7xl mx-auto">
        <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg shadow-lg flex-shrink-0">
            <MessageCircle size={28} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-400 truncate sm:whitespace-normal">Φόρουμ Κοινότητας</h1>
            <p className="text-sm text-slate-400 mt-1">Συνδεθείτε με την κοινότητα του μπιλιάρδου</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          <Button
            onClick={onBack}
            className="w-full md:w-auto px-5 sm:px-6 py-2 bg-blue-500/15 border border-blue-500/40 text-slate-300 hover:bg-blue-500/25 rounded-lg transition-all hover:-translate-y-0.5"
          >
            Πίσω
          </Button>
          {user && onNewDiscussion && (
            <Button
              onClick={onNewDiscussion}
              data-testid="new-topic-button"
              className="flex items-center gap-2 w-full md:w-auto px-5 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:-translate-y-1 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={20} />
              Νέο Θέμα
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
