import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '../../../components/ui/button.jsx';
import ForumPost from './ForumPost';

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
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-blue-400">
            {discussion.title}
            {discussion.isPinned && <span className="ml-2">📌</span>}
            {discussion.isLocked && <span className="ml-2">🔒</span>}
          </h2>
          <div className="flex flex-col md:flex-row gap-3 mt-2 text-sm">
            <span className="text-slate-400">Started by: {discussion.createdByUserId}</span>
            <span className="text-slate-400">{new Date(discussion.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <Button
          onClick={onBack}
          className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-slate-300 hover:bg-blue-500/20 rounded-lg text-sm transition-all"
        >
          Back
        </Button>
      </div>

      {/* Original Post */}
      <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
        <p className="text-slate-100">{discussion.content}</p>
      </div>

      {/* Posts Title */}
      <h3 className="text-lg font-bold text-slate-300">Posts ({postTree.length})</h3>

      {/* Sign-in Prompt */}
      {!user && <p className="text-sm text-slate-400">Sign in to like or reply.</p>}

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
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold text-sm rounded-lg hover:-translate-y-0.5 shadow-md hover:shadow-lg transition-all"
          >
            <MessageSquare size={16} />
            Post Reply
          </Button>
        </div>
      )}
    </div>
  );
}
