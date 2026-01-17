import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Star, 
  MessageSquare,
  X,
  User,
  Clock
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import * as forumService from '../api/forumService';

const Forum = ({ onBack }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [view, setView] = useState('categories'); // 'categories', 'discussions', 'detail'
  const [discussions, setDiscussions] = useState([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '', categoryId: '' });
  const [newPost, setNewPost] = useState({ content: '', replyToPostId: null });

  // Function to open new discussion modal with preselected category
  const openNewDiscussionModal = () => {
    setNewDiscussion({ 
      title: '', 
      content: '', 
      categoryId: selectedCategory?.id || '' 
    });
    setShowNewDiscussionModal(true);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'discussions', 'recent'

  const postTree = useMemo(() => {
    const map = {};
    const roots = [];

    posts.forEach(p => {
      map[p.id] = { ...p, replies: [] };
    });

    posts.forEach(p => {
      if (p.replyToPostId && map[p.replyToPostId]) {
        map[p.replyToPostId].replies.push(map[p.id]);
      } else {
        roots.push(map[p.id]);
      }
    });

    const sortTree = (list) => {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      list.forEach(child => sortTree(child.replies));
    };

    sortTree(roots);
    return roots;
  }, [posts]);

  useEffect(() => {
    loadCategories();
  }, []);

  // Handle navigation state for direct category access
  useEffect(() => {
    if (location.state?.selectedCategory) {
      handleCategorySelect(location.state.selectedCategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await forumService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDiscussions = async (categoryId) => {
    try {
      setLoading(true);
      const data = categoryId 
        ? await forumService.getCategoryDiscussions(categoryId)
        : await forumService.getAllDiscussions();
      setDiscussions(data);
    } catch (error) {
      console.error('Error loading discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDiscussionDetail = async (discussionId) => {
    try {
      setLoading(true);
      const discussion = await forumService.getDiscussion(discussionId);
      setSelectedDiscussion(discussion);
      const postsData = await forumService.getDiscussionPosts(discussionId);
      setPosts(postsData);
      setView('detail');
    } catch (error) {
      console.error('Error loading discussion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setView('discussions');
    loadDiscussions(category.id);
  };

  const handleCreateDiscussion = async () => {
    if (!newDiscussion.title || !newDiscussion.content || !newDiscussion.categoryId) {
      alert('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      await forumService.createDiscussion({
        title: newDiscussion.title,
        content: newDiscussion.content,
        categoryId: newDiscussion.categoryId
      });
      setShowNewDiscussionModal(false);
      setNewDiscussion({ title: '', content: '', categoryId: '' });
      // Reload discussions for the current category if one is selected
      if (selectedCategory) {
        loadDiscussions(selectedCategory.id);
      } else {
        loadDiscussions();
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
      alert('Failed to create discussion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.content) {
      alert('Please enter post content');
      return;
    }

    if (!user) {
      alert('Please sign in to post a reply');
      return;
    }

    try {
      setLoading(true);
      await forumService.createPost({
        discussionId: selectedDiscussion.id,
        content: newPost.content,
        replyToPostId: newPost.replyToPostId
      });
      setShowNewPostModal(false);
      setNewPost({ content: '', replyToPostId: null });
      loadDiscussionDetail(selectedDiscussion.id);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId) => {
    if (!user) {
      alert('Please sign in to like posts');
      return;
    }
    try {
      await forumService.likePost(postId);
      loadDiscussionDetail(selectedDiscussion.id);
    } catch (error) {
      console.error('Error liking post:', error);
      alert('Failed to like post');
    }
  };

  const handleMarkHelpful = async (postId) => {
    if (!user) {
      alert('Please sign in to mark helpful');
      return;
    }
    try {
      await forumService.markPostAsHelpful(postId);
      loadDiscussionDetail(selectedDiscussion.id);
    } catch (error) {
      console.error('Error marking post as helpful:', error);
      alert('Failed to mark as helpful');
    }
  };

  const handleReplyClick = (post) => {
    if (!user) {
      alert('Please sign in to reply');
      return;
    }
    setNewPost({ content: '', replyToPostId: post.id });
    setShowNewPostModal(true);
  };

  const filteredDiscussions = discussions.filter(d =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderPost = (post, depth = 0) => {
    const depthBg = depth > 0 ? 'rgba(255, 255, 255, 0.02)' : undefined;
    return (
      <div
        key={post.id}
        className={`p-4 border-l-2 border-blue-500/35 bg-slate-800/30 rounded-lg mb-1 relative ${depth > 0 ? 'ml-3' : ''}`}
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
              background: 'rgba(59,130,246,0.15)'
            }}
          />
        )}
        <div className="space-y-2">
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

          <p className="text-slate-100">{post.content}</p>
          
          <div className="flex flex-wrap gap-4 mt-3 p-2 bg-slate-800/50 rounded-sm">
            <button
              onClick={() => handleLikePost(post.id)}
              disabled={!user}
              className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Star size={14} className="opacity-50" />
              {post.likeCount}
            </button>
            <button
              onClick={() => handleReplyClick(post)}
              disabled={selectedDiscussion?.isLocked || !user}
              className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquare size={14} />
              Reply
            </button>
            <button
              onClick={() => handleMarkHelpful(post.id)}
              disabled={!user}
              className="px-2 py-1 text-xs font-semibold text-green-500 border border-green-500/30 rounded hover:bg-green-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Helpful
            </button>
          </div>
        </div>

        {post.replies && post.replies.map(child => renderPost(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 border-b border-purple-500/30 backdrop-blur-sm shadow-lg">
        <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-wrap max-w-7xl mx-auto">
          <div className="flex items-center gap-4 flex-1">
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
                onClick={openNewDiscussionModal}
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

      {/* Mobile Sorting Toolbar */}
      <div className="md:hidden bg-slate-800/95 border-b border-purple-500/20 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-400">Sort by:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('name')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                sortBy === 'name'
                  ? 'bg-purple-600/40 border border-purple-500/50 text-purple-200'
                  : 'bg-purple-600/10 border border-purple-500/20 text-purple-300 hover:bg-purple-600/20'
              }`}
            >
              Name
            </button>
            <button
              onClick={() => setSortBy('discussions')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                sortBy === 'discussions'
                  ? 'bg-purple-600/40 border border-purple-500/50 text-purple-200'
                  : 'bg-purple-600/10 border border-purple-500/20 text-purple-300 hover:bg-purple-600/20'
              }`}
            >
              Most Active
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                sortBy === 'recent'
                  ? 'bg-purple-600/40 border border-purple-500/50 text-purple-200'
                  : 'bg-purple-600/10 border border-purple-500/20 text-purple-300 hover:bg-purple-600/20'
              }`}
            >
              Recent
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow px-6 py-6 gap-6 max-w-7xl mx-auto w-full"
           style={{ 
             display: 'flex', 
             flexDirection: 'column',
             minHeight: 'calc(100vh - 160px)'
           }}
      >
        {/* Categories View */}
        {view === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 bg-gradient-to-b from-purple-600 to-purple-700 rounded-full shadow-lg" />
              <h2 className="text-2xl font-bold text-purple-400">Forum Categories</h2>
              <span className="text-xs text-slate-500">• Choose a category</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-max max-h-[calc(100vh-280px)] overflow-auto">
              {[...categories].sort((a, b) => {
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                if (sortBy === 'discussions') return (b.discussionCount || 0) - (a.discussionCount || 0);
                if (sortBy === 'recent') return new Date(b.modifiedAt || b.createdAt) - new Date(a.modifiedAt || a.createdAt);
                return 0;
              }).map(category => (
                <div
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className="cursor-pointer p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/25 rounded-xl hover:border-purple-500/60 hover:-translate-y-1 transition-all shadow-md hover:shadow-xl hover:shadow-purple-500/20 relative overflow-hidden group"
                >
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 shadow-md" />
                  
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💬</span>
                        <h3 className="text-base font-bold text-purple-300">{category.name}</h3>
                      </div>
                      <div className="px-2 py-1 bg-purple-500/20 rounded text-xs font-bold text-purple-300">
                        {category.discussionCount || 0}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{category.description}</p>
                    <div className="flex justify-between items-center mt-3 p-2 bg-purple-500/5 rounded text-xs font-semibold border border-purple-500/15">
                      <span className="text-purple-300/80">
                        {category.discussionCount === 1 ? '1 discussion' : `${category.discussionCount || 0} discussions`}
                      </span>
                      <span className="text-purple-300">View →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discussions View */}
        {view === 'discussions' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 md:gap-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-purple-700 rounded-full" />
                <h2 className="text-xl font-bold text-purple-400">{selectedCategory?.name}</h2>
              </div>
              <div className="flex gap-2 items-center">
                {user && (
                  <Button
                    onClick={openNewDiscussionModal}
                    data-testid="new-topic-button-discussions"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold text-sm rounded-lg hover:-translate-y-0.5 shadow-md hover:shadow-lg transition-all"
                  >
                    <Plus size={16} />
                    New Topic
                  </Button>
                )}
                <Button
                  onClick={() => setView('categories')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600/10 border border-purple-500/30 text-slate-300 hover:bg-purple-600/20 rounded-lg text-sm transition-all"
                >
                  <MessageCircle size={16} />
                  All Categories
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent outline-none text-slate-100 placeholder-slate-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              {filteredDiscussions.length > 0 ? (
                filteredDiscussions.map(discussion => (
                  <div
                    key={discussion.id}
                    onClick={() => loadDiscussionDetail(discussion.id)}
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
                <div className="p-8 bg-slate-800/50 border border-slate-700 rounded-lg text-center">
                  <p className="text-slate-400">No discussions found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Discussion Detail View */}
        {view === 'detail' && selectedDiscussion && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-3 md:gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-blue-400">
                  {selectedDiscussion.title}
                  {selectedDiscussion.isPinned && <span className="ml-2">📌</span>}
                  {selectedDiscussion.isLocked && <span className="ml-2">🔒</span>}
                </h2>
                <div className="flex flex-col md:flex-row gap-3 mt-2 text-sm">
                  <span className="text-slate-400">Started by: {selectedDiscussion.createdByUserId}</span>
                  <span className="text-slate-400">{new Date(selectedDiscussion.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <Button
                onClick={() => {
                  setView('discussions');
                  setSelectedDiscussion(null);
                }}
                className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-slate-300 hover:bg-blue-500/20 rounded-lg text-sm transition-all"
              >
                Back
              </Button>
            </div>

            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
              <p className="text-slate-100">{selectedDiscussion.content}</p>
            </div>

            <h3 className="text-lg font-bold text-slate-300">Posts ({posts.length})</h3>

            {!user && (
              <p className="text-sm text-slate-400">Sign in to like or reply.</p>
            )}

            <div className="space-y-2">
              {postTree.map(post => renderPost(post))}
            </div>

            {!selectedDiscussion.isLocked && user && (
              <div className="mt-6">
                <Button
                  onClick={() => {
                    setNewPost({ content: '', replyToPostId: null });
                    setShowNewPostModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold text-sm rounded-lg hover:-translate-y-0.5 shadow-md hover:shadow-lg transition-all"
                >
                  <MessageSquare size={16} />
                  Post Reply
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Discussion Modal */}
      {showNewDiscussionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div 
            className="bg-slate-900 border-2 border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-700 p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-purple-700 rounded-full" />
                <h2 className="text-xl font-bold text-purple-400">Start New Topic</h2>
              </div>
              <button
                onClick={() => setShowNewDiscussionModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">Category</label>
                <select
                  value={newDiscussion.categoryId}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-500/30 rounded-lg bg-slate-800 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">Title</label>
                <input
                  type="text"
                  placeholder="Discussion title"
                  value={newDiscussion.title}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">Content</label>
                <textarea
                  placeholder="What would you like to discuss?"
                  value={newDiscussion.content}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowNewDiscussionModal(false)}
                  className="px-6 py-2 bg-purple-500/15 border border-purple-500/30 text-slate-300 hover:bg-purple-500/25 rounded-lg transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateDiscussion}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:-translate-y-0.5 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  Create Topic
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div 
            className="bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-700 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-300">Post Reply</h2>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">Your Reply</label>
                <textarea
                  placeholder="Write your reply here..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowNewPostModal(false)}
                  className="px-6 py-2 bg-blue-500/10 border border-blue-500/30 text-slate-300 hover:bg-blue-500/20 rounded-lg transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:-translate-y-0.5 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  Post Reply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;
