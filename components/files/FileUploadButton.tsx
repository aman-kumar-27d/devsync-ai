'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
    workspaceId?: string;
    channelId?: string;
    threadId?: string;
}

const MAX_MB = 20;

export default function FileUploadButton({ workspaceId, channelId, threadId }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    async function handleFile(file: File) {
        if (!workspaceId) { toast.error('No workspace context'); return; }
        if (file.size > MAX_MB * 1024 * 1024) { toast.error(`Max file size is ${MAX_MB} MB`); return; }
        setUploading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const res = await fetch(`/api/files/upload?workspaceId=${workspaceId}`, {
                method: 'POST',
                body: form,
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error ?? 'Upload failed');
            }
            const { file: uploaded } = await res.json();

            // Post a message with the file URL
            if (channelId) {
                const isImage = uploaded.mimetype.startsWith('image/');
                const content = isImage
                    ? `![${uploaded.originalName}](${uploaded.url})`
                    : `📎 [${uploaded.originalName}](${uploaded.url}) (${(uploaded.size / 1024).toFixed(1)} KB)`;

                await fetch(`/api/channels/${channelId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, type: 'file', ...(threadId ? { threadId } : {}) }),
                });
            }

            toast.success(`${uploaded.originalName} uploaded`);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    }

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="rounded p-1.5 text-muted hover:text-primary hover-bg text-sm disabled:opacity-40"
                title="Upload file"
            >
                {uploading ? '…' : '📎'}
            </button>
        </>
    );
}
