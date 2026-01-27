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
    <div className="sticky top-0 z-10 bg-slate-900/95 border-b border-purple-500/30 backdrop-blur-sm shadow-lg">
      <div className="px-8 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 flex-wrap max-w-7xl mx-auto">
        <div className="flex items-center gap-6 flex-1">
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-2 rounded-lg shadow-lg">
            <MessageCircle size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-purple-400">Community Forum</h1>
            <p className="text-sm text-slate-400 mt-1">Connect with the billiards community</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <Button
            onClick={onBack}
            className="px-6 py-2 bg-purple-500/15 border border-purple-500/40 text-slate-300 hover:bg-purple-500/25 rounded-lg transition-all hover:-translate-y-0.5"
          >
            Back
          </Button>
          {user && (
            <Button
              onClick={onNewDiscussion}
              data-testid="new-topic-button"
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-lg hover:-translate-y-1 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={20} />
              New Topic
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
