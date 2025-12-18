'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

const WORKSPACE_SLUG = 'maison_demo';

interface EditHistory {
  id: string;
  assetId: string;
  url: string;
  instruction: string;
  createdAt: string;
}

const EDIT_PRESETS = [
  { label: '丈 -8cm', instruction: '丈を8cm短くしてください' },
  { label: '丈 +8cm', instruction: '丈を8cm長くしてください' },
  { label: '襟を立てる', instruction: '襟を立ち襟にしてください' },
  { label: '襟を寝かせる', instruction: '襟を寝かせてください' },
  { label: 'ナイロン素材', instruction: '素材をテックナイロンに変更してください' },
  { label: 'ウール素材', instruction: '素材をウールツイードに変更してください' },
  { label: 'レザー素材', instruction: '素材をレザーに変更してください' },
  { label: '2トーン配色', instruction: '配色を2トーンに変更してください' },
  { label: 'モノトーン', instruction: '配色をモノトーン（白黒グレー）に変更してください' },
  { label: 'ポケット追加', instruction: 'ユーティリティポケットを追加してください' },
  { label: 'ジップ追加', instruction: 'ジップディテールを追加してください' },
  { label: 'オーバーサイズ', instruction: 'シルエットをオーバーサイズに変更してください' },
  { label: 'フィット', instruction: 'シルエットをフィットに変更してください' },
];

export default function RefinePage() {
  const params = useParams();
  const router = useRouter();
  const initialAssetId = params.assetId as string;

  const [currentAssetId, setCurrentAssetId] = useState(initialAssetId);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [history, setHistory] = useState<EditHistory[]>([]);

  const fetchAsset = useCallback(async (assetId: string) => {
    setLoading(true);
    try {
      // For now, construct URL from assetId
      // In production, you'd fetch the actual asset details
      const res = await fetch(`/api/assets?workspaceSlug=${WORKSPACE_SLUG}&assetId=${assetId}`);
      const data = await res.json();
      if (data.success && data.assets.length > 0) {
        setCurrentUrl(data.assets[0].url);
      }
    } catch (error) {
      console.error('Failed to fetch asset:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAsset(currentAssetId);
  }, [currentAssetId, fetchAsset]);

  const handleEdit = async (editInstruction: string) => {
    if (!editInstruction.trim()) return;

    setEditing(true);
    try {
      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceSlug: WORKSPACE_SLUG,
          parentAssetId: currentAssetId,
          instruction: editInstruction,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Add to history
        setHistory((prev) => [
          {
            id: data.editId,
            assetId: data.childAssetId,
            url: data.url,
            instruction: editInstruction,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);

        // Update current
        setCurrentAssetId(data.childAssetId);
        setCurrentUrl(data.url);
        setInstruction('');
      } else {
        alert(data.error || 'Edit failed');
      }
    } catch (error) {
      console.error('Edit error:', error);
      alert('Edit failed');
    } finally {
      setEditing(false);
    }
  };

  const handleSelectFromHistory = (item: EditHistory) => {
    setCurrentAssetId(item.assetId);
    setCurrentUrl(item.url);
  };

  return (
    <div className="min-h-screen pt-20 px-6 pb-8">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => router.back()}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--foreground)] tracking-[1px] uppercase mb-2 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-2xl tracking-[4px] uppercase mb-2">Refine Design</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Iterate and refine your generated design
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-3 gap-8">
        {/* Left Column - Current Image */}
        <div className="col-span-2">
          <div className="glass-card p-4">
            {loading ? (
              <div className="aspect-[4/5] flex items-center justify-center bg-[var(--background)]">
                <div className="spinner" />
              </div>
            ) : currentUrl ? (
              <div className="aspect-[4/5] relative overflow-hidden bg-[var(--background)]">
                <Image
                  src={currentUrl}
                  alt="Current design"
                  fill
                  className="object-contain"
                  sizes="60vw"
                />
                {editing && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <div className="spinner mb-4" />
                    <p className="text-sm breathing">Applying edit...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[4/5] flex items-center justify-center bg-[var(--background)]">
                <p className="text-[var(--text-secondary)]">Image not found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Edit Controls */}
        <div className="col-span-1 space-y-6">
          {/* Custom Instruction */}
          <div className="glass-card p-4">
            <h3 className="text-xs tracking-[2px] uppercase text-[var(--text-secondary)] mb-4">
              Edit Instruction
            </h3>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Describe the change..."
              rows={3}
              className="w-full bg-[var(--background)] border border-[var(--text-inactive)] px-4 py-3 text-sm focus:border-[var(--accent-cyan)] outline-none resize-none mb-4"
              disabled={editing}
            />
            <button
              onClick={() => handleEdit(instruction)}
              disabled={!instruction.trim() || editing}
              className="w-full btn-primary py-3 text-xs tracking-[1px] uppercase disabled:opacity-50"
            >
              Apply Edit
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="glass-card p-4">
            <h3 className="text-xs tracking-[2px] uppercase text-[var(--text-secondary)] mb-4">
              Quick Edits
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {EDIT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleEdit(preset.instruction)}
                  disabled={editing}
                  className="btn-glow px-3 py-2 text-xs disabled:opacity-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Edit History */}
          {history.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="text-xs tracking-[2px] uppercase text-[var(--text-secondary)] mb-4">
                Edit History ({history.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-[var(--background)] ${
                      item.assetId === currentAssetId
                        ? 'border border-[var(--accent-cyan)]'
                        : ''
                    }`}
                    onClick={() => handleSelectFromHistory(item)}
                  >
                    <div className="w-12 h-12 relative flex-shrink-0 bg-[var(--background)]">
                      <Image
                        src={item.url}
                        alt={`Edit ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs line-clamp-2">{item.instruction}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Original Link */}
          {history.length > 0 && (
            <button
              onClick={() => {
                setCurrentAssetId(initialAssetId);
                fetchAsset(initialAssetId);
              }}
              className="w-full text-xs text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] tracking-[1px] uppercase py-2"
            >
              ← Return to Original
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
