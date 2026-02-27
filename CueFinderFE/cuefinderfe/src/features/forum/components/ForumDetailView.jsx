import React from 'react';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '../../../components/ui/button.jsx';
import ForumPost from './ForumPost';
// Drill feature removed

/**
 * ForumDetailView - Displays a single discussion with all its posts
 * @component
 * @param {Object} discussion - Discussion data
 * @param {Array} postTree - Tree-structured posts for rendering
 * @param {Object} user - Current user
 * @param {Function} onBack - Callback to go back to discussions
 * @param {Function} onLikePost - Callback to like a post
 * @param {Function} onReplyClick - Callback to reply to post
 * @param {Function} onMarkHelpful - Callback to mark post as helpful
 * @param {Function} onNewPost - Callback to post new reply
 */
export default function ForumDetailView({
  discussion,
  postTree,
  user,
  onBack,
  onLikePost,
  onReplyClick,
  onMarkHelpful,
  onNewPost,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-3 md:gap-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-400 truncate sm:whitespace-normal">
            {discussion.title}
            {discussion.isPinned && <span className="ml-2">📌</span>}
            {discussion.isLocked && <span className="ml-2">🔒</span>}
          </h2>
        </div>
        <Button
          onClick={onBack}
          className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-slate-200 hover:bg-blue-500/20 rounded-lg text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Πίσω
        </Button>
      </div>

      {/* Drill preview removed in this branch */}

      {/* Posts Title */}
      <h3 className="text-lg font-bold text-slate-300">Αναρτήσεις ({postTree.length})</h3>

      {/* Sign-in Prompt */}
      {!user && <p className="text-sm text-slate-400">Συνδεθείτε για να κάνετε like ή να απαντήσετε.</p>}

      {/* Posts Tree */}
      <div className="space-y-2">
        {postTree.map((post) => (
          <ForumPost
            key={post.id}
            post={post}
            user={user}
            onLike={onLikePost}
            onReply={onReplyClick}
            onMarkHelpful={onMarkHelpful}
            discussionLocked={discussion.isLocked}
          />
        ))}
      </div>

      {/* New Post Button */}
      {!discussion.isLocked && user && (
        <div className="mt-6">
          <Button
            onClick={() => onNewPost(null)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm rounded-lg hover:-translate-y-0.5 shadow-md hover:shadow-lg transition-all"
          >
            <MessageSquare size={16} />
            Δημοσίευση Απάντησης
          </Button>
        </div>
      )}
    </div>
  );
}
