import { useState, useRef } from 'react';

interface UploadedFile {
  filename: string;
  thumbnail?: string; // Base64 preview
}

export default function SpriteUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    setError(null);

    // Create thumbnails for image files
    const fileThumbnails: Map<string, string> = new Map();
    const thumbnailPromises: Promise<void>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const promise = new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              fileThumbnails.set(file.name, e.target.result as string);
            }
            resolve();
          };
          reader.onerror = () => resolve(); // Skip on error
          reader.readAsDataURL(file);
        });
        thumbnailPromises.push(promise);
      }
    }

    // Wait for all thumbnails to load
    await Promise.all(thumbnailPromises);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('sprites', files[i]);
    }

    try {
      const response = await fetch('/api/sprites/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      // Add thumbnails to uploaded files
      const newFiles: UploadedFile[] = result.files.map((filename: string) => ({
        filename,
        thumbnail: fileThumbnails.get(filename),
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    } catch (err) {
      setError('Failed to upload sprites. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  return (
    <div className="min-h-screen p-8 pb-24 max-w-4xl mx-auto relative z-10">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-white">Sprite Upload</h1>
        <button
          onClick={() => window.location.href = '/sprites/organize'}
          className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors shadow-lg"
        >
          Organize Sprites →
        </button>
      </div>
      <p className="text-teal-200 mb-6">
        Upload your sprite pack files here. Supports ZIP archives, PNG, JPG, and PSD files.
      </p>

      <div
        className={`border-4 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? 'border-teal-400 bg-teal-500/20'
            : 'border-white/20 bg-white/10 backdrop-blur-sm'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,.psd,.zip,application/zip"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-teal-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <p className="text-xl text-white mb-4">
          {isDragging ? 'Drop files here!' : 'Drag & drop sprites here'}
        </p>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Or click to browse'}
        </button>

        <p className="text-sm text-teal-300 mt-4">
          Up to 500 files, 200MB each
        </p>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-white mb-3">
            Uploaded Files ({uploadedFiles.length})
          </h2>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 max-h-96 overflow-y-auto">
            {/* Grid view with thumbnails for images */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="bg-white/5 rounded-lg p-2 border border-white/20">
                  {file.thumbnail ? (
                    <div className="aspect-square bg-white/10 rounded mb-2 flex items-center justify-center overflow-hidden">
                      <img
                        src={file.thumbnail}
                        alt={file.filename}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-white/10 rounded mb-2 flex items-center justify-center">
                      <svg
                        className="h-8 w-8 text-teal-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="flex items-start gap-1">
                    <svg
                      className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <p className="text-xs text-teal-200 truncate" title={file.filename}>
                      {file.filename}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/sprites/organize'}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Organize Sprites →
          </button>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-500/20 border border-blue-400/50 rounded-lg backdrop-blur-sm">
        <h3 className="font-semibold text-white mb-2">📦 What happens next?</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-200">
          <li>Upload all your sprite pack files</li>
          <li>Click "Organize Sprites" to auto-categorize them</li>
          <li>I'll sort them into creatures, biomes, items, and UI folders</li>
          <li>You can preview and adjust the organization</li>
        </ol>
      </div>
    </div>
  );
}
