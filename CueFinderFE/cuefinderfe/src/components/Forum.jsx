import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageSquare, 
  Plus, 
  Search, 
  ThumbsUp, 
  Reply, 
  CheckCircle2,
  Lock,
  Users,
  Clock
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import * as forumService from '../api/forumService';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';

const Forum = ({ onBack }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [view, setView] = useState('categories');
  const [discussions, setDiscussions] = useState([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '', categoryId: '' });
  const [newPost, setNewPost] = useState({ content: '', replyToPostId: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

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
    return (
      <Card 
        key={post.id} 
        className={`${depth > 0 ? 'ml-8 mt-2' : 'mt-3'} border-l-2 border-l-primary/30`}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Post Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">
                  {post.createdByUsername || 'User'}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(post.createdAt)}
                </span>
              </div>
              {post.helpfulCount > 0 && (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {post.helpfulCount} helpful
                </Badge>
              )}
            </div>

            {/* Post Content */}
            <p className="text-sm">{post.content}</p>

            {/* Post Actions */}
            <div className="flex items-center gap-3 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLikePost(post.id)}
                disabled={!user}
                className="gap-1.5 h-8"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span className="text-xs">{post.likeCount}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReplyClick(post)}
                disabled={selectedDiscussion?.isLocked || !user}
                className="gap-1.5 h-8"
              >
                <Reply className="w-3.5 h-3.5" />
                <span className="text-xs">Reply</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkHelpful(post.id)}
                disabled={!user}
                className="gap-1.5 h-8 text-green-600 border-green-600/30 hover:bg-green-600/10"
              >
                <span className="text-xs">Helpful</span>
              </Button>
            </div>
          </div>
        </CardContent>

        {/* Nested Replies */}
        {post.replies && post.replies.map(child => renderPost(child, depth + 1))}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold mt-2">Forum</h1>
              </div>
            </div>
            {view !== 'categories' && user && (
              <Button onClick={() => {
                setNewDiscussion({ 
                  title: '', 
                  content: '', 
                  categoryId: selectedCategory?.id || '' 
                });
                setShowNewDiscussionModal(true);
              }} className="gap-2">
                <Plus className="w-4 h-4" />
                New Discussion
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Categories View */}
        {view === 'categories' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(category => (
                <Card
                  key={category.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                  onClick={() => handleCategorySelect(category)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {category.description}
                    </p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{category.discussionCount || 0} discussions</span>
                      <span>{category.postCount || 0} posts</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Discussions View */}
        {view === 'discussions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{selectedCategory?.name}</h2>
              <Button variant="outline" onClick={() => {
                setView('categories');
                setSelectedCategory(null);
              }}>
                Back to Categories
              </Button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search discussions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-3">
              {filteredDiscussions.map(discussion => (
                <Card
                  key={discussion.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                  onClick={() => loadDiscussionDetail(discussion.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{discussion.title}</h3>
                          {discussion.isLocked && (
                            <Badge variant="secondary">
                              <Lock className="w-3 h-3" />
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {discussion.content}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>by {discussion.createdByUsername}</span>
                          <span>•</span>
                          <span>{discussion.postCount || 0} replies</span>
                          <span>•</span>
                          <span>{formatRelativeTime(discussion.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Discussion Detail View */}
        {view === 'detail' && selectedDiscussion && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" onClick={() => {
                setView('discussions');
                setSelectedDiscussion(null);
                setPosts([]);
              }}>
                Back to Discussions
              </Button>
              {user && !selectedDiscussion.isLocked && (
                <Button onClick={() => {
                  setNewPost({ content: '', replyToPostId: null });
                  setShowNewPostModal(true);
                }} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Reply
                </Button>
              )}
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{selectedDiscussion.title}</CardTitle>
                  {selectedDiscussion.isLocked && (
                    <Badge variant="secondary">
                      <Lock className="w-3 h-3 mr-1" />
                      Locked
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                  <span>by {selectedDiscussion.createdByUsername}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(selectedDiscussion.createdAt)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{selectedDiscussion.content}</p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Replies ({posts.length})</h3>
              {postTree.map(post => renderPost(post, 0))}
            </div>
          </div>
        )}
      </div>

      {/* New Discussion Dialog */}
      <Dialog open={showNewDiscussionModal} onOpenChange={setShowNewDiscussionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Discussion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="disc-category">Category</Label>
              <Select
                value={newDiscussion.categoryId}
                onValueChange={(value) => setNewDiscussion({ ...newDiscussion, categoryId: value })}
              >
                <SelectTrigger id="disc-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="disc-title">Title</Label>
              <Input
                id="disc-title"
                value={newDiscussion.title}
                onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                placeholder="Enter discussion title"
              />
            </div>
            <div>
              <Label htmlFor="disc-content">Content</Label>
              <Textarea
                id="disc-content"
                value={newDiscussion.content}
                onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                placeholder="What would you like to discuss?"
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDiscussionModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDiscussion} disabled={loading}>
              {loading ? 'Creating...' : 'Create Discussion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Post Dialog */}
      <Dialog open={showNewPostModal} onOpenChange={setShowNewPostModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newPost.replyToPostId ? 'Reply to Post' : 'Add Reply'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="Write your reply..."
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPostModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePost} disabled={loading}>
              {loading ? 'Posting...' : 'Post Reply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Forum;
