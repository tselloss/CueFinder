import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button.jsx';
import { SearchInput, EmptyState } from '../../../shared/components';
import { parseDrillContent } from '../utils/drillUtils';
import DrillDesigner from './DrillDesigner';

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
  quickDrillTitle,
  quickDrillNotes,
  quickDrillLayout,
  onQuickDrillTitleChange,
  onQuickDrillNotesChange,
  onQuickDrillLayoutChange,
  onQuickCreateDrill,
  quickDrillLoading,
}) {
  const normalizedSearch = searchTerm.toLowerCase();
  const filteredDiscussions = discussions.filter((d) => {
    const drill = parseDrillContent(d.content);
    const notes = drill?.notes || '';
    return (
      d.title.toLowerCase().includes(normalizedSearch) ||
      notes.toLowerCase().includes(normalizedSearch) ||
      d.content.toLowerCase().includes(normalizedSearch)
    );
  });

  const getDiscussionExcerpt = (discussion) => {
    if (!discussion.content) return '—';
    return discussion.content.length > 120
      ? `${discussion.content.substring(0, 120)}...`
      : discussion.content;
  };

  const isPracticeDrills = /practise|practice/i.test(category?.name || '');
  const totalReplies = discussions.reduce((sum, d) => sum + (d.replyCount || 0), 0);
  const totalViews = discussions.reduce((sum, d) => sum + (d.viewCount || 0), 0);
  const drillroomHighlights = [
    {
      title: 'AI Shot Coach',
      description: 'Καταγράψτε μια βολή και λάβετε στοχευμένη ανατροφοδότηση βήμα-βήμα.',
    },
    {
      title: 'Προπονητικά Sets',
      description: 'Δημιουργήστε σειρές ασκήσεων με στόχο την ακρίβεια, το position play και το safety.',
    },
    {
      title: 'Progress Tracking',
      description: 'Παρακολουθήστε πρόοδο, συνέπεια και επίδοση ανά drill και εβδομάδα.',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 md:gap-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-700 rounded-full" />
          <h2 className="text-xl sm:text-2xl font-bold text-blue-400 truncate">{category.name}</h2>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {user && (
            <Button
              onClick={onNewDiscussion}
              data-testid="new-topic-button-discussions"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm rounded-lg hover:-translate-y-0.5 shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={16} />
              Νέο Θέμα
            </Button>
          )}
          <Button
            onClick={onBackToCategories}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/30 text-slate-200 hover:bg-blue-600/20 rounded-lg text-sm transition-all"
          >
            <ArrowLeft size={16} />
            Όλες οι Κατηγορίες
          </Button>
        </div>
      </div>

      {isPracticeDrills && (
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-widest bg-blue-500/15 text-blue-200 border border-blue-500/30 rounded-full">
                Drillroom Mode
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-blue-200">
                Practice Drills Lab
              </h3>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
                Οργανώστε προπονήσεις, μοιραστείτε drills και χτίστε την επόμενη συνεδρία σας με έμπνευση από την κοινότητα.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-3 bg-slate-900/80 border border-blue-500/25 rounded-xl text-center min-w-[120px]">
                <div className="text-lg font-bold text-blue-300">{discussions.length}</div>
                <div className="text-xs text-slate-400">Drills</div>
              </div>
              <div className="px-4 py-3 bg-slate-900/80 border border-blue-500/25 rounded-xl text-center min-w-[120px]">
                <div className="text-lg font-bold text-blue-300">{totalReplies}</div>
                <div className="text-xs text-slate-400">Replies</div>
              </div>
              <div className="px-4 py-3 bg-slate-900/80 border border-blue-500/25 rounded-xl text-center min-w-[120px]">
                <div className="text-lg font-bold text-blue-300">{totalViews}</div>
                <div className="text-xs text-slate-400">Views</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {drillroomHighlights.map((highlight) => (
              <div
                key={highlight.title}
                className="p-4 border border-blue-500/20 rounded-xl bg-slate-900/70 hover:border-blue-500/40 transition-all"
              >
                <h4 className="text-base font-semibold text-blue-300">{highlight.title}</h4>
                <p className="text-sm text-slate-400 mt-2">{highlight.description}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="button"
              onClick={user ? onNewDiscussion : undefined}
              className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
                user
                  ? 'bg-blue-600 text-white border-blue-500/40 hover:-translate-y-0.5 hover:shadow-lg'
                  : 'bg-slate-800/70 text-slate-500 border-slate-700 cursor-not-allowed'
              }`}
            >
              Δημιουργία νέου Drill
            </button>
            <div className="px-4 py-2 text-sm font-semibold rounded-lg border border-blue-500/20 text-blue-200 bg-blue-500/10">
              Προτεινόμενα: Aim • Position • Safety
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
            <div className="space-y-4">
              <DrillDesigner
                drill={quickDrillLayout}
                onChange={onQuickDrillLayoutChange}
              />
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-500/20 bg-slate-900/70 p-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Τίτλος Drill</label>
                  <input
                    type="text"
                    value={quickDrillTitle}
                    onChange={(e) => onQuickDrillTitleChange(e.target.value)}
                    placeholder="π.χ. 3-Ball Cut Drill"
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Σημειώσεις</label>
                  <textarea
                    rows={6}
                    value={quickDrillNotes}
                    onChange={(e) => onQuickDrillNotesChange(e.target.value)}
                    placeholder="Στόχος, tips, δυσκολία..."
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={onQuickCreateDrill}
                  disabled={quickDrillLoading}
                  className="w-full px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60"
                >
                  {user ? 'Αποθήκευση Drill' : 'Συνδεθείτε για αποθήκευση'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SearchInput
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Αναζήτηση συζητήσεων..."
      />

      <div className="space-y-2">
        {filteredDiscussions.length > 0 ? (
          filteredDiscussions.map((discussion) => {
            const drill = parseDrillContent(discussion.content);
            return (
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
                        {drill ? drill.notes?.trim() || 'Drill layout διαθέσιμο.' : getDiscussionExcerpt(discussion)}
                      </p>
                    </div>
                    {drill && (
                      <span className="ml-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-200 border border-blue-500/20">
                        Drill
                      </span>
                    )}
                  </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-3 text-xs">
                  <div className="flex gap-4">
                    <span className="text-slate-500 font-semibold">
                      👤 <span className="text-blue-400">{discussion.createdByUsername || 'User'}</span>
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
            );
          })
        ) : (
          <EmptyState title="No Discussions Found" message={searchTerm ? 'Try adjusting your search' : 'No discussions yet'} />
        )}
      </div>
    </div>
  );
}
