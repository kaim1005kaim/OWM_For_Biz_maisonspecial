'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const WORKSPACE_SLUG = 'maison_demo';

interface Board {
  id: string;
  name: string;
  asset_count: number;
  created_at: string;
}

export default function BoardListPage() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchBoards = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/boards?workspaceSlug=${WORKSPACE_SLUG}`);
      const data = await res.json();
      if (data.success) {
        setBoards(data.boards);
      }
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleCreate = async () => {
    if (!newBoardName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceSlug: WORKSPACE_SLUG,
          name: newBoardName.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewBoardName('');
        setShowCreate(false);
        fetchBoards();
        // Navigate to new board
        router.push(`/board/${data.board.id}`);
      }
    } catch (error) {
      console.error('Failed to create board:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (boardId: string) => {
    if (!confirm('Delete this board?')) return;

    try {
      await fetch(`/api/boards?boardId=${boardId}`, { method: 'DELETE' });
      fetchBoards();
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  };

  return (
    <div className="min-h-screen pt-20 px-6 pb-8">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl tracking-[4px] uppercase mb-2">Moodboards</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Reference sets for design generation
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-glow px-4 py-2 text-xs tracking-[1px] uppercase"
          >
            + New Board
          </button>
        </div>
      </div>

      {/* Board Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner" />
          </div>
        ) : boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <svg
              className="w-16 h-16 text-[var(--text-inactive)] mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="text-[var(--text-secondary)] mb-4">No moodboards yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-glow px-4 py-2 text-xs tracking-[1px] uppercase"
            >
              Create First Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {boards.map((board) => (
              <div
                key={board.id}
                className="glass-card p-4 cursor-pointer hover:border-[var(--accent-cyan)] transition-all group"
                onClick={() => router.push(`/board/${board.id}`)}
              >
                {/* Preview Placeholder */}
                <div className="aspect-video bg-[var(--background)] mb-4 flex items-center justify-center">
                  <span className="text-4xl text-[var(--text-inactive)]">
                    {board.asset_count}
                  </span>
                </div>

                {/* Board Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium tracking-[1px] uppercase mb-1">
                      {board.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {board.asset_count} images
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/generate/${board.id}`);
                      }}
                      className="text-[var(--accent-cyan)] hover:text-[var(--foreground)] text-xs"
                    >
                      Generate
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(board.id);
                      }}
                      className="text-[var(--accent-crimson)] hover:text-[var(--foreground)] text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          />
          <div className="relative glass-card w-full max-w-md mx-4 p-6 fade-in">
            <h2 className="text-lg tracking-[2px] uppercase mb-6">New Moodboard</h2>
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Board name..."
              className="w-full bg-[var(--background)] border border-[var(--text-inactive)] px-4 py-3 text-sm mb-4 focus:border-[var(--accent-cyan)] outline-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-xs tracking-[1px] uppercase text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newBoardName.trim() || creating}
                className="btn-primary px-4 py-2 text-xs tracking-[1px] uppercase disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
