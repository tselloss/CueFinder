import React from 'react';
import { User, Star, MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '../../../shared/utils/commonUtils';

/**
 * ForumPost - Individual forum post with replies
 * @component
 * @param {Object} post - Post data
 * @param {number} depth - Nesting depth (0 = root post)
 * @param {Object} user - Current user
 * @param {Function} onLike - Callback to like post
 * @param {Function} onReply - Callback to reply to post
 * @param {Function} onMarkHelpful - Callback to mark post as helpful
 * @param {boolean} discussionLocked - Whether discussion is locked
 */
export default function ForumPost({
  post,
  depth = 0,
  user,
  onLike,
  onReply,
  onMarkHelpful,
  discussionLocked = false,
}) {
  return (
    <div
      className={`p-4 border-l-2 border-blue-500/35 bg-slate-800/30 rounded-lg mb-1 relative ${
        depth > 0 ? 'ml-3' : ''
      }`}
      style={{ borderLeft: '3px solid rgba(59, 130, 246, 0.35)' }}
    >
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500/15"
          style={{
            position: 'absolute',
            left: -8,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'rgba(59,130,246,0.15)',
          }}
        />
      )}

      <div className="space-y-2">
        {/* Post Header */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <User size={18} className="text-purple-500" />
            <span className="text-xs font-bold text-slate-200">{post.createdByUsername || 'User'}</span>
            <span className="text-xs text-slate-500" title={new Date(post.createdAt).toLocaleString()}>
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
          {post.helpfulCount > 0 && (
            <span className="text-xs font-semibold text-green-500">✓ {post.helpfulCount} helpful</span>
          )}
        </div>

        {/* Post Content */}
        <p className="text-slate-100">{post.content}</p>

        {/* Post Actions */}
        <div className="flex flex-wrap gap-4 mt-3 p-2 bg-slate-800/50 rounded-sm">
          <button
            onClick={() => onLike(post.id)}
            disabled={!user}
            className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Star size={14} className="opacity-50" />
            {post.likeCount}
          </button>

          <button
            onClick={() => onReply(post.id)}
            disabled={discussionLocked || !user}
            className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageSquare size={14} />
            Reply
          </button>

          <button
            onClick={() => onMarkHelpful(post.id)}
            disabled={!user}
            className="px-2 py-1 text-xs font-semibold text-green-500 border border-green-500/30 rounded hover:bg-green-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Helpful
          </button>
        </div>
      </div>

      {/* Render Replies Recursively */}
      {post.replies &&
        post.replies.map((childPost) => (
          <ForumPost
            key={childPost.id}
            post={childPost}
            depth={depth + 1}
            user={user}
            onLike={onLike}
            onReply={onReply}
            onMarkHelpful={onMarkHelpful}
            discussionLocked={discussionLocked}
          />
        ))}
    </div>
  );
}
