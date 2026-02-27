import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { useForumState } from '../hooks';
import ForumHeader from './ForumHeader';
import ForumCategoriesView from './ForumCategoriesView';
import ForumDiscussionsView from './ForumDiscussionsView';
import ForumDetailView from './ForumDetailView';
import ForumNewDiscussionModal from './ForumNewDiscussionModal';
import ForumNewPostModal from './ForumNewPostModal';
// Drill utilities removed for this branch

/**
 * ForumContainer - Main forum component
 * Replaces the old monolithic Forum component with feature-based architecture
 *
 * @component
 * @param {Function} onBack - Callback to go back from forum
 *
 * @example
 * <ForumContainer onBack={() => navigate('/')} />
 */
export default function ForumContainer({ onBack }) {
  const { user } = useAuth();
  const location = useLocation();

  // Forum state management via custom hook
  const {
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
  } = useForumState(location.state?.selectedCategory);

  // Local component state
  const [sortBy, setSortBy] = useState('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newDiscussionForm, setNewDiscussionForm] = useState({
    title: '',
    content: '',
    categoryId: '',
  });
  const [newPostContent, setNewPostContent] = useState('');
  const [replyToPostId, setReplyToPostId] = useState(null);

  // Handlers
  const handleOpenNewDiscussionModal = () => {
    setNewDiscussionForm({
      title: '',
      content: '',
      categoryId: selectedCategory?.id || '',
    });
    setShowNewDiscussionModal(true);
  };

  const handleDiscussionFormChange = (field, value) => {
    setNewDiscussionForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateDiscussion = async () => {
    if (!newDiscussionForm.title || !newDiscussionForm.categoryId) {
      alert('Please fill all fields');
      return;
    }

    if (!newDiscussionForm.content) {
      alert('Please fill all fields');
      return;
    }

    if (!user) {
      alert('Please sign in to create a discussion');
      return;
    }

    try {
      await createDiscussion({
        title: newDiscussionForm.title,
        content: newDiscussionForm.content,
        categoryId: newDiscussionForm.categoryId,
      });
      setShowNewDiscussionModal(false);
      setNewDiscussionForm({ title: '', content: '', categoryId: '' });
    } catch (error) {
      alert(`Αποτυχία δημιουργίας συζήτησης: ${error.message}`);
    }
  };

  // Quick drill creation removed

  const handleCreatePost = async () => {
    if (!newPostContent) {
      alert('Παρακαλώ εισάγετε περιεχόμενο ανάρτησης');
      return;
    }

    if (!user) {
      alert('Παρακαλώ συνδεθείτε για να δημοσιεύσετε απάντηση');
      return;
    }

    try {
      await createPost({
        content: newPostContent,
        replyToPostId,
      });
      setShowNewPostModal(false);
      setNewPostContent('');
      setReplyToPostId(null);
    } catch (error) {
      alert('Αποτυχία δημιουργίας ανάρτησης');
    }
  };

  const handleReplyClick = (postId) => {
    if (!user) {
      alert('Παρακαλώ συνδεθείτε για να απαντήσετε');
      return;
    }
    setReplyToPostId(postId);
    setNewPostContent('');
    setShowNewPostModal(true);
  };

  const handleLikePost = async (postId) => {
    if (!user) {
      alert('Παρακαλώ συνδεθείτε για να κάνετε like');
      return;
    }
    try {
      await likePost(postId);
    } catch (error) {
      alert('Αποτυχία εκτέλεσης like');
    }
  };

  const handleMarkHelpful = async (postId) => {
    if (!user) {
      alert('Παρακαλώ συνδεθείτε για να σημειώσετε ως χρήσιμο');
      return;
    }
    try {
      await markPostAsHelpful(postId);
    } catch (error) {
      alert('Αποτυχία σήμανσης ως χρήσιμο');
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-auto">
      {/* Forum Header */}
      <ForumHeader
        user={user}
        onBack={onBack}
        onNewDiscussion={handleOpenNewDiscussionModal}
      />

      {/* Main Content */}
      <div
        className="flex-grow px-8 py-8 gap-8 max-w-7xl mx-auto w-full"
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 160px)',
        }}
      >
        {/* Categories View */}
        {view === 'categories' && (
          <ForumCategoriesView
            categories={categories}
            onCategorySelect={handleCategorySelect}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}

        {/* Discussions View */}
        {view === 'discussions' && selectedCategory && (
          <ForumDiscussionsView
            category={selectedCategory}
            discussions={discussions}
            onDiscussionSelect={loadDiscussionDetail}
            onBackToCategories={() => setView('categories')}
            onNewDiscussion={handleOpenNewDiscussionModal}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            user={user}
            
          />
        )}

        {/* Discussion Detail View */}
        {view === 'detail' && selectedDiscussion && (
          <ForumDetailView
            discussion={selectedDiscussion}
            postTree={postTree}
            user={user}
            onBack={() => {
              setView('discussions');
              setSearchTerm('');
            }}
            onLikePost={handleLikePost}
            onReplyClick={handleReplyClick}
            onMarkHelpful={handleMarkHelpful}
            onNewPost={(postId) => {
              setReplyToPostId(postId);
              setNewPostContent('');
              setShowNewPostModal(true);
            }}
          />
        )}

      </div>

      {/* Modals */}
      <ForumNewDiscussionModal
        isOpen={showNewDiscussionModal}
        formData={newDiscussionForm}
        onFormChange={handleDiscussionFormChange}
        categories={categories}
        onSubmit={handleCreateDiscussion}
        onClose={() => setShowNewDiscussionModal(false)}
        loading={loading}
      />

      <ForumNewPostModal
        isOpen={showNewPostModal}
        content={newPostContent}
        onContentChange={setNewPostContent}
        onSubmit={handleCreatePost}
        onClose={() => {
          setShowNewPostModal(false);
          setNewPostContent('');
          setReplyToPostId(null);
        }}
        loading={loading}
      />
    </div>
  );
}
