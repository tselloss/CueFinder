import { useState, useCallback, useMemo } from 'react';
import { useAsync } from '@cuefinder/common';
import * as forumService from '../../../api/forumService';

/**
 * useForumState Hook
 * Manages forum categories, discussions, and posts state
 */
export function useForumState() {
  const [view, setView] = useState('categories'); // 'categories', 'discussions', 'detail'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [categories, setCategories] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load categories
  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await forumService.getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load discussions for category
  const loadDiscussions = useCallback(async (categoryId) => {
    setLoading(true);
    try {
      const data = await forumService.getCategoryDiscussions(categoryId);
      setDiscussions(data || []);
    } catch (error) {
      console.error('Error loading discussions:', error);
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load posts for discussion
  const loadPosts = useCallback(async (discussionId) => {
    setLoading(true);
    try {
      const data = await forumService.getDiscussionPosts(discussionId);
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create discussion
  const createDiscussion = useCallback(async (discussionData) => {
    try {
      const newDiscussion = await forumService.createDiscussion(discussionData);
      setDiscussions(prev => [newDiscussion, ...prev]);
      return newDiscussion;
    } catch (error) {
      console.error('Error creating discussion:', error);
      throw error;
    }
  }, []);

  // Create post
  const createPost = useCallback(async (postData) => {
    try {
      const newPost = await forumService.createPost(postData);
      setPosts(prev => [newPost, ...prev]);
      return newPost;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }, []);

  // Delete discussion
  const deleteDiscussion = useCallback(async (discussionId) => {
    try {
      await forumService.deleteDiscussion(discussionId);
      setDiscussions(prev => prev.filter(d => d.id !== discussionId));
    } catch (error) {
      console.error('Error deleting discussion:', error);
      throw error;
    }
  }, []);

  // Delete post
  const deletePost = useCallback(async (postId) => {
    try {
      await forumService.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }, []);

  // Build post tree (threading)
  const postTree = useMemo(() => {
    const map = {};
    const roots = [];

    posts.forEach(p => {
      map[p.id] = { ...p, replies: [] };
    });

    posts.forEach(p => {
      if (p.replyToPostId && map[p.replyToPostId]) {
        map[p.replyToPostId].replies.push(map[p.id]);
      } else if (!p.replyToPostId) {
        roots.push(map[p.id]);
      }
    });

    return roots;
  }, [posts]);

  return {
    view,
    setView,
    selectedCategory,
    setSelectedCategory,
    selectedDiscussion,
    setSelectedDiscussion,
    categories,
    discussions,
    posts,
    postTree,
    loading,
    loadCategories,
    loadDiscussions,
    loadPosts,
    createDiscussion,
    createPost,
    deleteDiscussion,
    deletePost
  };
}
