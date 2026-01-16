import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Text, 
  Button, 
  TextInput,
  Card,
  Layer,
  TextArea,
  Select
} from 'grommet';
import { 
  Chat, 
  Add, 
  Search, 
  Star, 
  ChatOption,
  Close,
  User,
  Clock
} from 'grommet-icons';
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
      <Card
        key={post.id}
        background={depthBg || 'background-front'}
        pad="medium"
        elevation="xsmall"
        style={{
          borderLeft: '3px solid rgba(59, 130, 246, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '10px',
          marginLeft: depth * 14,
          marginBottom: 6,
          position: 'relative'
        }}
      >
        {depth > 0 && (
          <Box
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
        <Box gap="small">
          <Box direction="row" justify="between" align="center">
            <Box direction="row" gap="small" align="center">
              <User size="18px" color="brand" />
              <Text size="small" weight={700}>
                {post.createdByUsername || 'User'}
              </Text>
              <Text size="xsmall" color="text-weak" title={new Date(post.createdAt).toLocaleString()}>
                {formatRelativeTime(post.createdAt)}
              </Text>
            </Box>
            {post.helpfulCount > 0 && (
              <Text size="small" weight={600} color="status-ok">
                ✓ {post.helpfulCount} helpful
              </Text>
            )}
          </Box>

          <Text>{post.content}</Text>
          <Box
            direction="row"
            gap="medium"
            margin={{ top: 'small' }}
            pad={{ vertical: 'xsmall' }}
            background="rgba(255,255,255,0.015)"
            round="xsmall"
          >
            <Button
              icon={<Star
                size="14px"
                color="text-weak"
                fill="none"
              />}
              label={<Text size="xsmall" weight={600}>{post.likeCount}</Text>}
              onClick={() => handleLikePost(post.id)}
              disabled={!user}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0',
                gap: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#8b5cf6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'inherit';
              }}
            />
            <Button
              icon={<ChatOption size="14px" color="text-weak" />}
              label={<Text size="xsmall" weight={600}>Reply</Text>}
              onClick={() => handleReplyClick(post)}
              disabled={selectedDiscussion?.isLocked || !user}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0',
                gap: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!selectedDiscussion?.isLocked) {
                  e.currentTarget.style.color = '#8b5cf6';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'inherit';
              }}
            />
            <Button
              label={<Text size="xsmall" weight={600}>Helpful</Text>}
              onClick={() => handleMarkHelpful(post.id)}
              disabled={!user}
              style={{
                background: 'transparent',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '4px',
                padding: '4px 8px',
                color: '#22c55e',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
              }}
            />
          </Box>
        </Box>

        {post.replies && post.replies.map(child => renderPost(child, depth + 1))}
      </Card>
    );
  };

  return (
    <Box fill background="background" overflow="auto">
      {/* Header */}
      <Box
        background="background-front"
        pad={{ horizontal: 'large', vertical: 'medium' }}
        border={{ side: 'bottom', color: 'rgba(139, 92, 246, 0.3)' }}
        elevation="medium"
        style={{
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <Box direction="row" justify="between" align="center" gap="medium" wrap>
          <Box direction="row" align="center" gap="medium" flex="grow">
            <Box
              background="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
              pad="small"
              round="small"
              style={{ boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)' }}
            >
              <Chat size="32px" color="white" />
            </Box>
            <Box>
              <Heading level="2" margin="none" style={{ color: '#8b5cf6', fontSize: '24px', fontWeight: 700 }}>
                Community Forum
              </Heading>
              <Text size="small" color="text-weak" style={{ marginTop: '4px' }}>
                Connect with the billiards community
              </Text>
            </Box>
          </Box>
          <Box direction="row" gap="medium" align="center">
            <Button
              label={<Text weight={600} size="medium">Back</Text>}
              onClick={onBack}
              style={{
                background: 'rgba(139, 92, 246, 0.15)',
                border: '2px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            />
            {user && (
              <Button
                data-testid="new-topic-button"
                icon={<Add size="20px" />}
                label={<Text weight={700} size="medium" color="white">New Topic</Text>}
                onClick={openNewDiscussionModal}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 28px',
                  color: 'white',
                  fontWeight: 700,
                  boxShadow: '0 6px 16px rgba(139, 92, 246, 0.4)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Mobile Sorting Toolbar */}
      <Box
        background="rgba(15, 23, 42, 0.95)"
        pad={{ horizontal: 'medium', vertical: 'small' }}
        border={{ side: 'bottom', color: 'rgba(139, 92, 246, 0.2)' }}
        className="mobile-toolbar"
      >
        <style>{`
          .mobile-toolbar {
            display: flex !important;
          }
          @media (min-width: 769px) {
            .mobile-toolbar {
              display: none !important;
            }
          }
        `}</style>
        <Box direction="row" gap="small" align="center" justify="between">
          <Text size="xsmall" weight={600} color="text-weak">
            Sort by:
          </Text>
          <Box direction="row" gap="xsmall">
            <Button
              size="small"
              onClick={() => setSortBy('name')}
              style={{
                background: sortBy === 'name' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.1)',
                border: sortBy === 'name' ? '1px solid rgba(139, 92, 246, 0.6)' : '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                color: sortBy === 'name' ? '#c4b5fd' : '#a78bfa',
                transition: 'all 0.2s ease'
              }}
            >
              Name
            </Button>
            <Button
              size="small"
              onClick={() => setSortBy('discussions')}
              style={{
                background: sortBy === 'discussions' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.1)',
                border: sortBy === 'discussions' ? '1px solid rgba(139, 92, 246, 0.6)' : '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                color: sortBy === 'discussions' ? '#c4b5fd' : '#a78bfa',
                transition: 'all 0.2s ease'
              }}
            >
              Most Active
            </Button>
            <Button
              size="small"
              onClick={() => setSortBy('recent')}
              style={{
                background: sortBy === 'recent' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.1)',
                border: sortBy === 'recent' ? '1px solid rgba(139, 92, 246, 0.6)' : '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                color: sortBy === 'recent' ? '#c4b5fd' : '#a78bfa',
                transition: 'all 0.2s ease'
              }}
            >
              Recent
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box flex="grow" pad={{ horizontal: 'large', vertical: 'medium' }} gap="medium" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Categories View */}
        {view === 'categories' && (
          <Box gap="medium" height="100%" style={{ overflow: 'hidden' }}>
            <Box direction="row" align="center" gap="small">
              <Box
                width="4px"
                height="28px"
                background="linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%)"
                round="small"
                style={{ boxShadow: '0 0 12px rgba(139, 92, 246, 0.4)' }}
              />
              <Heading level="3" margin="none" style={{ color: '#8b5cf6', fontSize: '24px', fontWeight: 700 }}>
                Forum Categories
              </Heading>
              <Text size="xsmall" color="text-weak">
                • Choose a category
              </Text>
            </Box>
            <Box
              direction="row"
              wrap
              gap="small"
              align="stretch"
              style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px',
                maxHeight: 'calc(100vh - 280px)',
                overflow: 'auto'
              }}
            >
              {[...categories].sort((a, b) => {
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                if (sortBy === 'discussions') return (b.discussionCount || 0) - (a.discussionCount || 0);
                if (sortBy === 'recent') return new Date(b.modifiedAt || b.createdAt) - new Date(a.modifiedAt || a.createdAt);
                return 0;
              }).map(category => (
                <Card
                  key={category.id}
                  background="linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)"
                  pad="none"
                  elevation="small"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: '2px solid rgba(139, 92, 246, 0.25)',
                    borderRadius: '12px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
                    height: 'fit-content'
                  }}
                  onClick={() => handleCategorySelect(category)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(139, 92, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.25)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)';
                  }}
                >
                  <Box
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
                      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)'
                    }}
                  />
                  <Box pad="medium" gap="small">
                    <Box direction="row" align="center" justify="between" gap="small">
                      <Box direction="row" align="center" gap="xsmall">
                        <Text style={{ fontSize: '20px' }}>💬</Text>
                        <Heading level="4" margin="none" style={{ color: '#c4b5fd', fontSize: '16px', fontWeight: 700 }}>
                          {category.name}
                        </Heading>
                      </Box>
                      <Box 
                        pad="xxsmall"
                        background="rgba(139, 92, 246, 0.2)"
                        round="xsmall"
                      >
                        <Text size="xsmall" weight={700} style={{ color: '#c4b5fd' }}>
                          {category.discussionCount || 0}
                        </Text>
                      </Box>
                    </Box>
                    <Text size="small" color="text-weak" style={{ lineHeight: '1.5', opacity: 0.85 }}>
                      {category.description}
                    </Text>
                    <Box 
                      direction="row" 
                      justify="between" 
                      align="center" 
                      margin={{ top: 'small' }} 
                      pad="xsmall" 
                      background="rgba(139, 92, 246, 0.05)"
                      round="xsmall"
                      style={{ border: '1px solid rgba(139, 92, 246, 0.15)' }}
                    >
                      <Text size="xsmall" weight={600} style={{ color: '#a78bfa' }}>
                        {category.discussionCount === 1 ? '1 discussion' : `${category.discussionCount || 0} discussions`}
                      </Text>
                      <Text size="xsmall" weight={700} style={{ color: '#c4b5fd' }}>
                        View →
                      </Text>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* Discussions View */}
        {view === 'discussions' && (
          <Box gap="large">
            <Box direction="row" justify="between" align="center" wrap>
              <Box direction="row" align="center" gap="small">
                <Box
                  width="4px"
                  height="24px"
                  background="linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%)"
                  round="xsmall"
                />
                <Heading level="3" margin="none" style={{ color: '#8b5cf6' }}>
                  {selectedCategory?.name}
                </Heading>
              </Box>
              <Box direction="row" gap="small" align="center">
                {user && (
                  <Button
                    data-testid="new-topic-button-discussions"
                    icon={<Add size="18px" />}
                    label={<Text weight={700} size="small" color="white">New Topic</Text>}
                    onClick={openNewDiscussionModal}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 20px',
                      color: 'white',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
                    }}
                  />
                )}
                <Button
                  icon={<Chat size="16px" />}
                  onClick={() => setView('categories')}
                  label={<Text weight={600} size="small">All Categories</Text>}
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                  }}
                />
              </Box>
            </Box>

            <TextInput
              placeholder="Search discussions..."
              icon={<Search />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                borderRadius: '10px',
                border: '2px solid rgba(139, 92, 246, 0.3)',
                padding: '12px 16px',
                fontSize: '14px'
              }}
            />

            <Box gap="small">
              {filteredDiscussions.length > 0 ? (
                filteredDiscussions.map(discussion => (
                  <Card
                    key={discussion.id}
                    background="background-front"
                    pad="medium"
                    elevation="small"
                    style={{
                      cursor: 'pointer',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => loadDiscussionDetail(discussion.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                      e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.9)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                      e.currentTarget.style.backgroundColor = 'rgb(15, 23, 42)';
                    }}
                  >
                    <Box gap="small">
                      <Box direction="row" justify="between" align="start">
                        <Box flex="grow">
                          <Heading level="4" margin="none" color="brand">
                            {discussion.title}
                            {discussion.isPinned && <Text size="small"> 📌</Text>}
                            {discussion.isLocked && <Text size="small"> 🔒</Text>}
                          </Heading>
                          <Text size="small" color="text-weak" margin={{ top: 'xsmall' }}>
                            {discussion.content.substring(0, 100)}...
                          </Text>
                        </Box>
                      </Box>
                      <Box direction="row" justify="between" align="center" margin={{ top: 'small' }}>
                        <Box direction="row" gap="medium" align="center">
                          <Text size="xsmall" color="text-weak" weight={600}>
                            <User size="14px" style={{ marginRight: '4px' }} />
                            {discussion.createdByUserId}
                          </Text>
                          <Text size="xsmall" color="text-weak" weight={600}>
                            <Clock size="14px" style={{ marginRight: '4px' }} />
                            {new Date(discussion.createdAt).toLocaleDateString()}
                          </Text>
                        </Box>
                        <Box direction="row" gap="small">
                          <Text size="xsmall" weight={600}>
                            💬 {discussion.replyCount}
                          </Text>
                          <Text size="xsmall" weight={600}>
                            👁️ {discussion.viewCount}
                          </Text>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                ))
              ) : (
                <Card background="background-front" pad="large" elevation="small">
                  <Text align="center" color="text-weak">
                    No discussions found
                  </Text>
                </Card>
              )}
            </Box>
          </Box>
        )}

        {/* Discussion Detail View */}
        {view === 'detail' && selectedDiscussion && (
          <Box gap="medium">
            <Box direction="row" justify="between" align="start">
              <Box flex="grow">
                <Heading level="3" margin="none" color="brand">
                  {selectedDiscussion.title}
                  {selectedDiscussion.isPinned && <Text size="large"> 📌</Text>}
                  {selectedDiscussion.isLocked && <Text size="large"> 🔒</Text>}
                </Heading>
                <Box direction="row" gap="medium" margin={{ top: 'small' }} align="center">
                  <Text size="small" color="text-weak">
                    Started by: {selectedDiscussion.createdByUserId}
                  </Text>
                  <Text size="small" color="text-weak">
                    {new Date(selectedDiscussion.createdAt).toLocaleDateString()}
                  </Text>
                </Box>
              </Box>
              <Button
                label={<Text weight={600} size="small">Back</Text>}
                onClick={() => {
                  setView('discussions');
                  setSelectedDiscussion(null);
                }}
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
              />
            </Box>

            <Card background="background-front" pad="medium" elevation="small">
              <Text>{selectedDiscussion.content}</Text>
            </Card>

            <Heading level="4" margin="none">Posts ({posts.length})</Heading>

            {!user && (
              <Text size="small" color="text-weak" margin={{ bottom: 'small' }}>
                Sign in to like or reply.
              </Text>
            )}

            <Box gap="small">
              {postTree.map(post => renderPost(post))}
            </Box>

            {!selectedDiscussion.isLocked && user && (
              <Box margin={{ top: 'medium' }}>
                <Button
                  icon={<ChatOption size="16px" />}
                  label={<Text weight={600} size="small">Post Reply</Text>}
                  onClick={() => {
                    setNewPost({ content: '', replyToPostId: null });
                    setShowNewPostModal(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.9))',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px'
                  }}
                />
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* New Discussion Modal */}
      {showNewDiscussionModal && (
        <Layer
          onEsc={() => setShowNewDiscussionModal(false)}
          onClickOutside={() => setShowNewDiscussionModal(false)}
        >
          <Box 
            pad="large" 
            gap="large" 
            width="large" 
            background="background-front"
            style={{
              border: '2px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)'
            }}
          >
            <Box direction="row" justify="between" align="center">
              <Box direction="row" align="center" gap="small">
                <Box
                  width="4px"
                  height="24px"
                  background="linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%)"
                  round="xsmall"
                />
                <Heading level="3" margin="none" style={{ color: '#8b5cf6' }}>
                  Start New Topic
                </Heading>
              </Box>
              <Button
                icon={<Close size="20px" />}
                onClick={() => setShowNewDiscussionModal(false)}
                plain
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              />
            </Box>

            <Box gap="medium">
              <Box>
                <Text weight={600} margin={{ bottom: 'small' }}>Category</Text>
                <Select
                  options={categories}
                  labelKey="name"
                  valueKey="id"
                  value={categories.find(c => c.id === newDiscussion.categoryId)}
                  onChange={({ option }) => setNewDiscussion({ ...newDiscussion, categoryId: option.id })}
                  placeholder="Select a category"
                  style={{
                    background: 'rgba(139, 92, 246, 0.05)',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '10px',
                    padding: '12px'
                  }}
                />
              </Box>

              <Box>
                <Text weight={600} margin={{ bottom: 'small' }}>Title</Text>
                <TextInput
                  placeholder="Discussion title"
                  value={newDiscussion.title}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                />
              </Box>

              <Box>
                <Text weight={600} margin={{ bottom: 'small' }}>Content</Text>
                <TextArea
                  placeholder="What would you like to discuss?"
                  value={newDiscussion.content}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                  rows={6}
                />
              </Box>

              <Box direction="row" gap="medium" justify="end">
                <Button
                  label={<Text weight={600} size="small">Cancel</Text>}
                  onClick={() => setShowNewDiscussionModal(false)}
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '10px',
                    padding: '10px 24px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                  }}
                />
                <Button
                  label={<Text weight={600} size="small">Create Topic</Text>}
                  onClick={handleCreateDiscussion}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 24px',
                    color: 'white',
                    fontWeight: 600,
                    boxShadow: '0 4px 8px rgba(139, 92, 246, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(139, 92, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(139, 92, 246, 0.3)';
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Layer>
      )}

      {/* New Post Modal */}
      {showNewPostModal && (
        <Layer
          onEsc={() => setShowNewPostModal(false)}
          onClickOutside={() => setShowNewPostModal(false)}
        >
          <Box pad="large" gap="medium" width="large" background="background-front">
            <Box direction="row" justify="between" align="center">
              <Heading level="3" margin="none">Post Reply</Heading>
              <Button
                icon={<Close size="20px" />}
                onClick={() => setShowNewPostModal(false)}
                plain
              />
            </Box>

            <Box gap="medium">
              <Box>
                <Text weight={600} margin={{ bottom: 'small' }}>Your Reply</Text>
                <TextArea
                  placeholder="Write your reply here..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={6}
                />
              </Box>

              <Box direction="row" gap="small" justify="end">
                <Button
                  label={<Text weight={600} size="small">Cancel</Text>}
                  onClick={() => setShowNewPostModal(false)}
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 16px'
                  }}
                />
                <Button
                  label={<Text weight={600} size="small">Post Reply</Text>}
                  onClick={handleCreatePost}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.9))',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px'
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Layer>
      )}
    </Box>
  );
};

export default Forum;
