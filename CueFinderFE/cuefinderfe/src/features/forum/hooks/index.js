import { useCallback, useEffect, useMemo, useState } from 'react';
import * as forumService from '../../../api/forumService';

export function useForumState(initialCategory) {
  const [view, setView] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || null);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const postTree = useMemo(() => {
    const map = {};
    const roots = [];

    posts.forEach((post) => {
      map[post.id] = { ...post, replies: [] };
    });

    posts.forEach((post) => {
      if (post.replyToPostId && map[post.replyToPostId]) {
        map[post.replyToPostId].replies.push(map[post.id]);
      } else {
        roots.push(map[post.id]);
      }
    });

    const sortTree = (list) => {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      list.forEach((child) => sortTree(child.replies));
    };

    sortTree(roots);
    return roots;
  }, [posts]);

  const dedupeCategories = useCallback((items = []) => {
    const seen = new Set();
    return items.filter((cat) => {
      const key = `${cat?.id ?? ''}-${(cat?.name || '').toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await forumService.getCategories();
      setCategories(dedupeCategories(data || []));
    } catch (error) {
      console.error('Forum: failed to load categories', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [dedupeCategories]);

  const loadDiscussions = useCallback(async (categoryId) => {
    try {
      setLoading(true);
      const data = categoryId
        ? await forumService.getCategoryDiscussions(categoryId)
        : await forumService.getAllDiscussions();
      setDiscussions(data || []);
    } catch (error) {
      console.error('Forum: failed to load discussions', error);
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDiscussionDetail = useCallback(async (discussionId) => {
    if (!discussionId) return;
    try {
      setLoading(true);
      const discussion = await forumService.getDiscussion(discussionId);
      const postsData = await forumService.getDiscussionPosts(discussionId);
      setSelectedDiscussion(discussion || null);
      setPosts(postsData || []);
      setView('detail');
    } catch (error) {
      console.error('Forum: failed to load discussion detail', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCategorySelect = useCallback(
    (category) => {
      if (!category) return;
      setSelectedCategory(category);
      setView('discussions');
      loadDiscussions(category.id);
    },
    [loadDiscussions]
  );

  const createDiscussion = useCallback(
    async ({ title, content, categoryId }) => {
      if (!title || !content || !categoryId) {
        throw new Error('Missing fields for discussion');
      }
      try {
        setLoading(true);
        await forumService.createDiscussion({ title, content, categoryId });
        setSelectedCategory((prev) => prev || categories.find((c) => c.id === categoryId) || null);
        await loadDiscussions(categoryId);
        setView('discussions');
      } catch (error) {
        console.error('Forum: failed to create discussion', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [categories, loadDiscussions]
  );

  const createPost = useCallback(
    async ({ content, replyToPostId }) => {
      const discussionId = selectedDiscussion?.id;
      if (!discussionId) {
        throw new Error('No discussion selected');
      }
      if (!content) {
        throw new Error('Post content required');
      }
      try {
        setLoading(true);
        await forumService.createPost({
          discussionId,
          content,
          replyToPostId: replyToPostId || null,
        });
        await loadDiscussionDetail(discussionId);
      } catch (error) {
        console.error('Forum: failed to create post', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [loadDiscussionDetail, selectedDiscussion]
  );

  const likePost = useCallback(
    async (postId) => {
      if (!postId || !selectedDiscussion?.id) return;
      try {
        await forumService.likePost(postId);
        await loadDiscussionDetail(selectedDiscussion.id);
      } catch (error) {
        console.error('Forum: failed to like post', error);
      }
    },
    [loadDiscussionDetail, selectedDiscussion]
  );

  const markPostAsHelpful = useCallback(
    async (postId) => {
      if (!postId || !selectedDiscussion?.id) return;
      try {
        await forumService.markPostAsHelpful(postId);
        await loadDiscussionDetail(selectedDiscussion.id);
      } catch (error) {
        console.error('Forum: failed to mark post as helpful', error);
      }
    },
    [loadDiscussionDetail, selectedDiscussion]
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (initialCategory) {
      handleCategorySelect(initialCategory);
    }
  }, [handleCategorySelect, initialCategory]);

  return {
    view,
    categories,
    discussions,
    selectedCategory,
    selectedDiscussion,
    postTree,
    loading,
    setView,
    handleCategorySelect,
    loadDiscussionDetail,
    createDiscussion,
    createPost,
    likePost,
    markPostAsHelpful,
  };
}
