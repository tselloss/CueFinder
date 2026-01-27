import React from 'react';
import { MessageCircle, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button.jsx';
import { SearchInput, EmptyState } from '../../../shared/components';

/**
 * ForumDiscussionsView - Displays discussions for a category
 * @component
 * @param {Object} category - Selected category
 * @param {Array} discussions - Array of discussions
 * @param {Function} onDiscussionSelect - Callback when discussion is selected
 * @param {Function} onBackToCategories - Callback to go back to categories
 * @param {Function} onNewDiscussion - Callback to create new discussion
 * @param {string} searchTerm - Current search term
 * @param {Function} onSearchChange - Callback to update search
 * @param {Object} user - Current user
 */
export default function ForumDiscussionsView({
  category,
  discussions,
  onDiscussionSelect,
  onBackToCategories,
  onNewDiscussion,
  searchTerm,
  onSearchChange,
  user,
}) {
  const filteredDiscussions = discussions.filter((d) =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 md:gap-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-purple-700 rounded-full" />
          <h2 className="text-xl font-bold text-purple-400">{category.name}</h2>
        </div>
        <div className="flex gap-2 items-center">
          {user && (
            <Button
              onClick={onNewDiscussion}
              data-testid="new-topic-button-discussions"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold text-sm rounded-lg hover:-translate-y-0.5 shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={16} />
              New Topic
            </Button>
          )}
          <Button
            onClick={onBackToCategories}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/10 border border-purple-500/30 text-slate-300 hover:bg-purple-600/20 rounded-lg text-sm transition-all"
          >
            <MessageCircle size={16} />
            All Categories
          </Button>
        </div>
      </div>

      <SearchInput
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Search discussions..."
      />

      <div className="space-y-2">
        {filteredDiscussions.length > 0 ? (
          filteredDiscussions.map((discussion) => (
            <div
              key={discussion.id}
              onClick={() => onDiscussionSelect(discussion.id)}
              className="cursor-pointer p-4 bg-slate-800/50 border border-blue-500/20 rounded-lg hover:border-blue-500/50 hover:bg-slate-800/70 transition-all"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-blue-400">
                      {discussion.title}
                      {discussion.isPinned && <span className="ml-2">📌</span>}
                      {discussion.isLocked && <span className="ml-2">🔒</span>}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                      {discussion.content.substring(0, 100)}...
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-3 text-xs">
                  <div className="flex gap-4">
                    <span className="text-slate-500 font-semibold">
                      👤 {discussion.createdByUserId}
                    </span>
                    <span className="text-slate-500 font-semibold">
                      🕐 {new Date(discussion.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-slate-300">💬 {discussion.replyCount}</span>
                    <span className="font-semibold text-slate-300">👁️ {discussion.viewCount}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState title="No Discussions Found" message={searchTerm ? 'Try adjusting your search' : 'No discussions yet'} />
        )}
      </div>
    </div>
  );
}
