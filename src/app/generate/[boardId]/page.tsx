'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

const WORKSPACE_SLUG = 'maison_demo';

interface BoardAsset {
  id: string;
  url: string;
  thumbUrl: string | null;
}

interface Board {
  id: string;
  name: string;
  assets: BoardAsset[];
}

interface GeneratedOutput {
  id: string;
  assetId: string;
  url: string;
  liked?: boolean;
  score?: number;
}

interface EditHistory {
  id: string;
  assetId: string;
  url: string;
  instruction: string;
  createdAt: string;
}

interface DetailViewResult {
  heroAssetId: string;
  heroUrl: string;
  garmentViews: {
    frontAssetId: string;
    frontUrl: string;
    sideAssetId: string;
    sideUrl: string;
    backAssetId: string;
    backUrl: string;
  } | null;
}

type GarmentCategory =
  | 'coat'
  | 'blouson'
  | 'jacket'
  | 'vest'
  | 'shirt'
  | 'knit'
  | 'pants'
  | 'skirt'
  | 'onepiece';

type ViewStyle = 'ghost' | 'flatlay';

const GARMENT_CATEGORIES: { value: GarmentCategory; label: string }[] = [
  { value: 'coat', label: 'コート' },
  { value: 'blouson', label: 'ブルゾン' },
  { value: 'jacket', label: 'ジャケット' },
  { value: 'vest', label: 'ベスト' },
  { value: 'shirt', label: 'シャツ' },
  { value: 'knit', label: 'ニット' },
  { value: 'pants', label: 'パンツ' },
  { value: 'skirt', label: 'スカート' },
  { value: 'onepiece', label: 'ワンピース' },
];

const PROMPT_TEMPLATES = [
  { label: 'Tech', prompt: 'Technical fabric, functional details, urban utility aesthetic' },
  { label: 'Mode', prompt: 'High fashion, editorial quality, avant-garde silhouettes' },
  { label: 'Street', prompt: 'Streetwear aesthetic, oversized fit, graphic elements' },
  { label: 'Minimal', prompt: 'Clean lines, monochrome palette, architectural shapes' },
  { label: 'Classic', prompt: 'Timeless elegance, tailored fit, sophisticated details' },
];

const EDIT_PRESETS = [
  { label: '丈 -8cm', instruction: '丈を8cm短くしてください' },
  { label: '丈 +8cm', instruction: '丈を8cm長くしてください' },
  { label: '襟を立てる', instruction: '襟を立ち襟にしてください' },
  { label: 'ナイロン素材', instruction: '素材をテックナイロンに変更してください' },
  { label: 'ウール素材', instruction: '素材をウールツイードに変更してください' },
  { label: 'レザー素材', instruction: '素材をレザーに変更してください' },
  { label: 'モノトーン', instruction: '配色をモノトーン（白黒グレー）に変更してください' },
  { label: 'ポケット追加', instruction: 'ユーティリティポケットを追加してください' },
  { label: 'オーバーサイズ', instruction: 'シルエットをオーバーサイズに変更してください' },
];

export default function GeneratePage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.boardId as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState<4 | 8 | 12>(4);
  const [category, setCategory] = useState<GarmentCategory | ''>('');
  const [outputs, setOutputs] = useState<GeneratedOutput[]>([]);
  const [inspiration, setInspiration] = useState('');
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>([]);

  // Edit drawer state
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<{ assetId: string; url: string } | null>(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [editing, setEditing] = useState(false);
  const [editHistory, setEditHistory] = useState<EditHistory[]>([]);

  // Detail view drawer state
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailAsset, setDetailAsset] = useState<{ assetId: string; url: string } | null>(null);
  const [viewStyle, setViewStyle] = useState<ViewStyle>('ghost');
  const [generatingViews, setGeneratingViews] = useState(false);
  const [detailResult, setDetailResult] = useState<DetailViewResult | null>(null);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/boards?workspaceSlug=${WORKSPACE_SLUG}&boardId=${boardId}`);
      const data = await res.json();
      if (data.success) {
        setBoard(data.board);
      }
    } catch (error) {
      console.error('Failed to fetch board:', error);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    setOutputs([]);
    setInspiration('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceSlug: WORKSPACE_SLUG,
          boardId,
          prompt: prompt.trim(),
          count,
          aspectRatio: '4:5',
          imageSize: '2K',
          ...(category && { category }),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOutputs(data.outputs);
        setInspiration(data.inspiration || '');
      } else {
        alert(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOutput = (id: string) => {
    setSelectedOutputs((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleRefine = (assetId: string) => {
    router.push(`/refine/${assetId}`);
  };

  // Open edit drawer
  const handleOpenEdit = (assetId: string, url: string) => {
    setEditingAsset({ assetId, url });
    setEditDrawerOpen(true);
    setEditInstruction('');
    setEditHistory([]);
  };

  // Close edit drawer
  const handleCloseEdit = () => {
    setEditDrawerOpen(false);
    setEditingAsset(null);
    setEditInstruction('');
  };

  // Apply edit
  const handleApplyEdit = async (instruction: string) => {
    if (!instruction.trim() || !editingAsset) return;

    setEditing(true);
    try {
      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceSlug: WORKSPACE_SLUG,
          parentAssetId: editingAsset.assetId,
          instruction,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditHistory((prev) => [
          {
            id: data.editId,
            assetId: data.childAssetId,
            url: data.url,
            instruction,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);

        setEditingAsset({ assetId: data.childAssetId, url: data.url });

        setOutputs((prev) => [
          {
            id: data.editId,
            assetId: data.childAssetId,
            url: data.url,
          },
          ...prev,
        ]);

        setEditInstruction('');
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

  // Select from edit history
  const handleSelectFromHistory = (item: EditHistory) => {
    setEditingAsset({ assetId: item.assetId, url: item.url });
  };

  // Open detail view drawer
  const handleOpenDetailView = (assetId: string, url: string) => {
    setDetailAsset({ assetId, url });
    setDetailDrawerOpen(true);
    setDetailResult(null);
    setViewStyle('ghost');
  };

  // Close detail view drawer
  const handleCloseDetailView = () => {
    setDetailDrawerOpen(false);
    setDetailAsset(null);
    setDetailResult(null);
  };

  // Generate detail views (hero + garment 3-view)
  const handleGenerateViews = async () => {
    if (!detailAsset) return;

    setGeneratingViews(true);
    try {
      const res = await fetch('/api/generate-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceSlug: WORKSPACE_SLUG,
          assetId: detailAsset.assetId,
          viewStyle,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDetailResult({
          heroAssetId: data.heroAssetId,
          heroUrl: data.heroUrl,
          garmentViews: data.garmentViews,
        });
      } else {
        alert(data.error || 'Detail generation failed');
      }
    } catch (error) {
      console.error('Detail generation error:', error);
      alert('Detail generation failed');
    } finally {
      setGeneratingViews(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!board || board.assets.length < 3) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center">
        <p className="text-[var(--text-secondary)] mb-4">
          Board needs at least 3 reference images
        </p>
        <button
          onClick={() => router.push(`/board/${boardId}`)}
          className="btn-glow px-4 py-2 text-xs tracking-[1px] uppercase"
        >
          Back to Board
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-6 pb-8">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => router.push(`/board/${boardId}`)}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--foreground)] tracking-[1px] uppercase mb-2 flex items-center gap-2"
        >
          &larr; Back to {board.name}
        </button>
        <h1 className="text-2xl tracking-[4px] uppercase mb-2">Generate Designs</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Create new design variations based on your reference images
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-3 gap-8">
        {/* Left Column - Reference & Controls */}
        <div className="col-span-1 space-y-6">
          {/* Reference Preview */}
          <div className="glass-card p-4">
            <h3 className="text-xs tracking-[2px] uppercase text-[var(--text-secondary)] mb-4">
              Reference Images ({board.assets.length})
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {board.assets.slice(0, 8).map((asset) => (
                <div key={asset.id} className="aspect-square relative overflow-hidden bg-[var(--background)]">
                  <Image
                    src={asset.thumbUrl || asset.url}
                    alt="Reference"
                    fill
                    className="object-cover"
                    sizes="50px"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="glass-card p-4">
            <h3 className="text-xs tracking-[2px] uppercase text-[var(--text-secondary)] mb-4">
              Design Direction
            </h3>

            {/* Category Selector */}
            <div className="mb-4">
              <label className="text-xs text-[var(--text-secondary)] mb-2 block">
                MD Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GarmentCategory | '')}
                className="w-full bg-[var(--background)] border border-[var(--text-inactive)] px-4 py-2 text-sm focus:border-[var(--accent-cyan)] outline-none appearance-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {GARMENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} ({cat.value})
                  </option>
                ))}
              </select>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the design direction..."
              rows={4}
              className="w-full bg-[var(--background)] border border-[var(--text-inactive)] px-4 py-3 text-sm focus:border-[var(--accent-cyan)] outline-none resize-none mb-4"
            />

            {/* Template Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {PROMPT_TEMPLATES.map((template) => (
                <button
                  key={template.label}
                  onClick={() => setPrompt(template.prompt)}
                  className="tag-chip hover:bg-[var(--accent-cyan)]/20"
                >
                  {template.label}
                </button>
              ))}
            </div>

            {/* Count Selection */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs text-[var(--text-secondary)]">Generate:</span>
              {([4, 8, 12] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCount(c)}
                  className={`px-3 py-1 text-xs ${
                    count === c
                      ? 'bg-[var(--accent-cyan)] text-black'
                      : 'bg-[var(--background)] border border-[var(--text-inactive)]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
              className="w-full btn-primary py-3 text-sm tracking-[1px] uppercase disabled:opacity-50"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner w-4 h-4" />
                  Generating...
                </span>
              ) : (
                `Generate ${count} Designs`
              )}
            </button>
          </div>

          {/* Inspiration */}
          {inspiration && (
            <div className="glass-card p-4">
              <h3 className="text-xs tracking-[2px] uppercase text-[var(--text-secondary)] mb-2">
                AI Inspiration
              </h3>
              <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap">
                {inspiration}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Generated Results */}
        <div className="col-span-2">
          {generating ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="spinner mb-4" />
              <p className="text-sm text-[var(--text-secondary)] breathing">
                Generating {count} design variations...
              </p>
              <p className="text-xs text-[var(--text-inactive)] mt-2">
                This may take a few minutes
              </p>
            </div>
          ) : outputs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <p className="text-[var(--text-secondary)]">
                Enter a design direction and generate
              </p>
            </div>
          ) : (
            <>
              {/* Actions Bar */}
              {selectedOutputs.length > 0 && (
                <div className="mb-4 flex items-center justify-between glass-card p-3">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {selectedOutputs.length} selected
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedOutputs([])}
                      className="text-xs text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                    >
                      Clear
                    </button>
                    <button className="btn-glow-amber px-4 py-2 text-xs tracking-[1px] uppercase">
                      Export Selected
                    </button>
                  </div>
                </div>
              )}

              {/* Results Grid */}
              <div className="grid grid-cols-4 gap-4">
                {outputs.map((output) => (
                  <div
                    key={output.id}
                    className={`relative group cursor-pointer ${
                      selectedOutputs.includes(output.id)
                        ? 'ring-2 ring-[var(--accent-cyan)]'
                        : ''
                    }`}
                    onClick={() => handleSelectOutput(output.id)}
                  >
                    <div className="aspect-[4/5] relative overflow-hidden bg-[var(--background-card)]">
                      <Image
                        src={output.url}
                        alt="Generated design"
                        fill
                        className="object-cover image-hover"
                        sizes="25vw"
                      />

                      {/* Selection Indicator */}
                      {selectedOutputs.includes(output.id) && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--accent-cyan)] flex items-center justify-center">
                          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetailView(output.assetId, output.url);
                          }}
                          className="btn-glow-amber px-4 py-1.5 text-xs w-28 text-center"
                        >
                          Detail View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(output.assetId, output.url);
                          }}
                          className="btn-glow px-4 py-1.5 text-xs w-28 text-center"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRefine(output.assetId);
                          }}
                          className="btn-glow px-4 py-1.5 text-xs w-28 text-center"
                        >
                          Refine
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Results Summary */}
              <div className="mt-6 text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  {outputs.length} designs generated
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Drawer */}
      {editDrawerOpen && editingAsset && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={handleCloseEdit}
          />

          {/* Drawer */}
          <div className="absolute right-0 top-0 h-full w-[500px] bg-[var(--background)] border-l border-[var(--text-inactive)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--text-inactive)]">
              <h2 className="text-sm tracking-[2px] uppercase">Edit Design</h2>
              <button
                onClick={handleCloseEdit}
                className="text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Current Image */}
              <div className="aspect-[4/5] relative overflow-hidden bg-[var(--background-card)]">
                <Image
                  src={editingAsset.url}
                  alt="Current design"
                  fill
                  className="object-contain"
                  sizes="500px"
                />
                {editing && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <div className="spinner mb-4" />
                    <p className="text-sm breathing">Applying edit...</p>
                  </div>
                )}
              </div>

              {/* Custom Instruction */}
              <div className="glass-card p-4">
                <h3 className="text-xs tracking-[2px] uppercase text-[var(--text-secondary)] mb-3">
                  Edit Instruction
                </h3>
                <textarea
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                  placeholder="Describe the change... (e.g., 袖を短くする、色を黒に変更)"
                  rows={3}
                  className="w-full bg-[var(--background)] border border-[var(--text-inactive)] px-4 py-3 text-sm focus:border-[var(--accent-cyan)] outline-none resize-none mb-3"
                  disabled={editing}
                />
                <button
                  onClick={() => handleApplyEdit(editInstruction)}
                  disabled={!editInstruction.trim() || editing}
                  className="w-full btn-primary py-2 text-xs tracking-[1px] uppercase disabled:opacity-50"
                >
                  Apply Edit
                </button>
              </div>

              {/* Quick Edit Presets */}
              <div className="glass-card p-4">
                <h3 className="text-xs tracking-[2px] uppercase text-[var(--text-secondary)] mb-3">
                  Quick Edits
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {EDIT_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handleApplyEdit(preset.instruction)}
                      disabled={editing}
                      className="btn-glow px-2 py-2 text-xs disabled:opacity-50"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit History */}
              {editHistory.length > 0 && (
                <div className="glass-card p-4">
                  <h3 className="text-xs tracking-[2px] uppercase text-[var(--text-secondary)] mb-3">
                    Edit History ({editHistory.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {editHistory.map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-[var(--background)] ${
                          item.assetId === editingAsset.assetId
                            ? 'border border-[var(--accent-cyan)]'
                            : ''
                        }`}
                        onClick={() => handleSelectFromHistory(item)}
                      >
                        <div className="w-10 h-10 relative flex-shrink-0 bg-[var(--background)]">
                          <Image
                            src={item.url}
                            alt={`Edit ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <p className="text-xs line-clamp-2 flex-1">{item.instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--text-inactive)]">
              <button
                onClick={handleCloseEdit}
                className="w-full btn-glow py-2 text-xs tracking-[1px] uppercase"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail View Drawer */}
      {detailDrawerOpen && detailAsset && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={handleCloseDetailView}
          />

          {/* Drawer - wider for detail view */}
          <div className="absolute right-0 top-0 h-full w-[720px] bg-[var(--background)] border-l border-[var(--text-inactive)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--text-inactive)]">
              <h2 className="text-sm tracking-[2px] uppercase">Detail View Generation</h2>
              <button
                onClick={handleCloseDetailView}
                className="text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Source Design */}
              <div className="glass-card p-4">
                <h3 className="text-xs tracking-[2px] uppercase text-[var(--text-secondary)] mb-3">
                  Source Design
                </h3>
                <div className="aspect-[4/5] relative overflow-hidden bg-[var(--background-card)] max-w-[200px]">
                  <Image
                    src={detailAsset.url}
                    alt="Source design"
                    fill
                    className="object-contain"
                    sizes="200px"
                  />
                </div>
              </div>

              {/* View Style Selection */}
              {!detailResult && (
                <div className="glass-card p-4">
                  <h3 className="text-xs tracking-[2px] uppercase text-[var(--text-secondary)] mb-3">
                    Garment View Style
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setViewStyle('ghost')}
                      className={`p-3 text-left border ${
                        viewStyle === 'ghost'
                          ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10'
                          : 'border-[var(--text-inactive)] hover:border-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">Ghost Mannequin</div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        Invisible mannequin style. 3D shape with no visible body.
                      </div>
                    </button>
                    <button
                      onClick={() => setViewStyle('flatlay')}
                      className={`p-3 text-left border ${
                        viewStyle === 'flatlay'
                          ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10'
                          : 'border-[var(--text-inactive)] hover:border-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">Flat Lay</div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        Overhead product shot. Garment laid flat on white surface.
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={handleGenerateViews}
                    disabled={generatingViews}
                    className="w-full btn-primary py-3 text-sm tracking-[1px] uppercase disabled:opacity-50"
                  >
                    {generatingViews ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="spinner w-4 h-4" />
                        Generating Views...
                      </span>
                    ) : (
                      'Generate Hero + 3-View'
                    )}
                  </button>
                  {generatingViews && (
                    <p className="text-xs text-[var(--text-inactive)] mt-2 text-center">
                      Generating hero shot and garment spec sheet...
                    </p>
                  )}
                </div>
              )}

              {/* Results */}
              {detailResult && (
                <>
                  {/* Hero Shot */}
                  <div className="glass-card p-4">
                    <h3 className="text-xs tracking-[2px] uppercase text-[var(--text-secondary)] mb-3">
                      Hero Shot (Editorial)
                    </h3>
                    <div className="aspect-[9/16] relative overflow-hidden bg-[var(--background-card)] max-w-[320px] mx-auto">
                      <Image
                        src={detailResult.heroUrl}
                        alt="Hero shot"
                        fill
                        className="object-contain"
                        sizes="320px"
                      />
                    </div>
                  </div>

                  {/* Garment 3-View */}
                  {detailResult.garmentViews && (
                    <div className="glass-card p-4">
                      <h3 className="text-xs tracking-[2px] uppercase text-[var(--text-secondary)] mb-3">
                        Garment Views ({viewStyle === 'ghost' ? 'Ghost Mannequin' : 'Flat Lay'})
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs text-[var(--text-inactive)] mb-1 text-center uppercase">Front</p>
                          <div className="aspect-[3/4] relative overflow-hidden bg-[var(--background-card)]">
                            <Image
                              src={detailResult.garmentViews.frontUrl}
                              alt="Front view"
                              fill
                              className="object-contain"
                              sizes="200px"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-inactive)] mb-1 text-center uppercase">
                            {viewStyle === 'ghost' ? 'Side' : 'Detail'}
                          </p>
                          <div className="aspect-[3/4] relative overflow-hidden bg-[var(--background-card)]">
                            <Image
                              src={detailResult.garmentViews.sideUrl}
                              alt="Side/Detail view"
                              fill
                              className="object-contain"
                              sizes="200px"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-inactive)] mb-1 text-center uppercase">Back</p>
                          <div className="aspect-[3/4] relative overflow-hidden bg-[var(--background-card)]">
                            <Image
                              src={detailResult.garmentViews.backUrl}
                              alt="Back view"
                              fill
                              className="object-contain"
                              sizes="200px"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Regenerate */}
                  <button
                    onClick={() => setDetailResult(null)}
                    className="w-full btn-glow py-2 text-xs tracking-[1px] uppercase"
                  >
                    Generate Again
                  </button>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--text-inactive)]">
              <button
                onClick={handleCloseDetailView}
                className="w-full btn-glow py-2 text-xs tracking-[1px] uppercase"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
