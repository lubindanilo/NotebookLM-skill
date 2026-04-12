import { useCallback, useRef, useState } from "react";
import { uploadFile } from "../api";
import type { SourceInput as SourceInputType, SourceType } from "../types";

interface Props {
  sources: SourceInputType[];
  onChange: (sources: SourceInputType[]) => void;
}

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: "url", label: "URL" },
  { value: "youtube", label: "YouTube" },
  { value: "file", label: "File" },
  { value: "text", label: "Text" },
  { value: "drive", label: "Google Drive" },
];

let nextId = 1;

export default function SourceInput({ sources, onChange }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addSource = (type: SourceType = "url") => {
    onChange([...sources, { id: String(nextId++), type, value: "" }]);
  };

  const updateSource = (id: string, patch: Partial<SourceInputType>) => {
    onChange(sources.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeSource = (id: string) => {
    onChange(sources.filter((s) => s.id !== id));
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      setUploading(true);
      const newSources: SourceInputType[] = [];
      for (const file of Array.from(files)) {
        try {
          const result = await uploadFile(file);
          newSources.push({
            id: String(nextId++),
            type: "file",
            value: result.filename,
            originalName: result.original_name,
          });
        } catch {
          // skip failed uploads
        }
      }
      onChange([...sources, ...newSources]);
      setUploading(false);
    },
    [sources, onChange]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sources</h2>
        <button
          onClick={() => addSource()}
          className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg transition"
        >
          + Add source
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition
          ${dragOver ? "border-blue-400 bg-blue-950/30" : "border-gray-700 hover:border-gray-500"}`}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <p className="text-gray-400">Uploading...</p>
        ) : (
          <p className="text-gray-400">
            Drop files here or <span className="text-blue-400">click to browse</span>
            <br />
            <span className="text-xs text-gray-500">PDF, DOCX, TXT, MD, EPUB, CSV, images</span>
          </p>
        )}
      </div>

      {/* Source list */}
      <div className="space-y-2">
        {sources.map((src) => (
          <div key={src.id} className="flex gap-2 items-start bg-gray-900 rounded-lg p-3">
            <select
              value={src.type}
              onChange={(e) => updateSource(src.id, { type: e.target.value as SourceType })}
              className="bg-gray-800 rounded px-2 py-1.5 text-sm border border-gray-700 shrink-0"
            >
              {SOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <div className="flex-1 space-y-1">
              {src.type === "file" ? (
                <div className="text-sm text-gray-300 py-1">
                  {src.originalName || src.value}
                </div>
              ) : src.type === "text" ? (
                <>
                  <input
                    type="text"
                    placeholder="Title"
                    value={src.title || ""}
                    onChange={(e) => updateSource(src.id, { title: e.target.value })}
                    className="w-full bg-gray-800 rounded px-2 py-1 text-sm border border-gray-700"
                  />
                  <textarea
                    placeholder="Paste text content..."
                    value={src.value}
                    onChange={(e) => updateSource(src.id, { value: e.target.value })}
                    rows={3}
                    className="w-full bg-gray-800 rounded px-2 py-1 text-sm border border-gray-700 resize-y"
                  />
                </>
              ) : src.type === "drive" ? (
                <>
                  <input
                    type="text"
                    placeholder="File ID or Drive URL"
                    value={src.value}
                    onChange={(e) => updateSource(src.id, { value: e.target.value })}
                    className="w-full bg-gray-800 rounded px-2 py-1 text-sm border border-gray-700"
                  />
                  <input
                    type="text"
                    placeholder="Title"
                    value={src.title || ""}
                    onChange={(e) => updateSource(src.id, { title: e.target.value })}
                    className="w-full bg-gray-800 rounded px-2 py-1 text-sm border border-gray-700"
                  />
                </>
              ) : (
                <input
                  type="text"
                  placeholder={src.type === "youtube" ? "YouTube URL" : "URL"}
                  value={src.value}
                  onChange={(e) => updateSource(src.id, { value: e.target.value })}
                  className="w-full bg-gray-800 rounded px-2 py-1.5 text-sm border border-gray-700"
                />
              )}
            </div>

            <button
              onClick={() => removeSource(src.id)}
              className="text-gray-500 hover:text-red-400 transition p-1 shrink-0"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
