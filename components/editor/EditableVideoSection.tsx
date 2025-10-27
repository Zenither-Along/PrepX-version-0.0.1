import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ResizeGripIcon } from '../icons';

export const EditableVideoSection: React.FC<{
    url: string | undefined;
    onUrlChange: (newUrl: string) => void;
    width: number | undefined;
    onWidthChange: (newWidth: number) => void;
}> = ({ url, onUrlChange, width, onWidthChange }) => {
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceTimeoutRef = useRef<number | null>(null);
    const [isResizing, setIsResizing] = useState(false);
    const videoRef = useRef<HTMLDivElement>(null);

    const startVideoResize = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsResizing(true);
        const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const videoNode = videoRef.current;
        if (!videoNode) return;

        const startWidth = videoNode.offsetWidth;
        const parentWidth = videoNode.parentElement?.offsetWidth || startWidth;

        const doDrag = (moveEvent: MouseEvent | TouchEvent) => {
            const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const newWidth = startWidth + (currentX - startX);
            const newWidthPercent = Math.max(20, Math.min((newWidth / parentWidth) * 100, 100));
            onWidthChange(newWidthPercent);
        };
        const stopDrag = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', doDrag as EventListener);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', doDrag as EventListener);
            document.removeEventListener('touchend', stopDrag);
        };
        
        document.addEventListener('mousemove', doDrag as EventListener);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', doDrag as EventListener);
        document.addEventListener('touchend', stopDrag);
    }, [onWidthChange]);


    const fetchThumbnail = async (videoUrl: string) => {
        if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.trim()) {
            setThumbnailUrl(null);
            setError(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        // YouTube
        let match = videoUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (match && match[1]) {
            setThumbnailUrl(`https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`);
            setIsLoading(false);
            return;
        }

        // Vimeo
        match = videoUrl.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:video\/)?(\d+)/);
        if (match && match[1]) {
            try {
                const response = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}`);
                if (!response.ok) throw new Error('Vimeo API error');
                const data = await response.json();
                setThumbnailUrl(data.thumbnail_url);
            } catch (err) {
                console.error("Failed to fetch Vimeo thumbnail", err);
                setThumbnailUrl(null);
                setError('Could not fetch Vimeo thumbnail.');
            } finally {
                setIsLoading(false);
            }
            return;
        }
        
        setThumbnailUrl(null);
        setError(videoUrl.trim() ? 'Invalid YouTube or Vimeo URL.' : null);
        setIsLoading(false);
    };

    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = window.setTimeout(() => {
            fetchThumbnail(url || '');
        }, 500);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [url]);

    return (
        <div>
            <input 
                type="text" 
                value={url || ''} 
                onChange={e => onUrlChange(e.target.value)} 
                placeholder="Video URL (YouTube, Vimeo)" 
                className="w-full p-2 border border-gray-300 rounded-md bg-brand-primary mb-2" 
            />
            {isLoading && <div className="w-full aspect-video bg-gray-200 animate-pulse rounded-md" />}
            {error && <p className="text-sm text-red-600 px-1">{error}</p>}
            {thumbnailUrl && !isLoading && (
                 <div ref={videoRef} className="relative inline-block" style={{ width: `${width || 100}%` }}>
                    <div className={`relative mt-2 transition-shadow ${isResizing ? 'shadow-2xl ring-2 ring-blue-500' : ''}`}>
                        <img src={thumbnailUrl} alt="Video Thumbnail" className="w-full aspect-video object-cover rounded-md" />
                    </div>
                    <div
                        onMouseDown={startVideoResize}
                        onTouchStart={startVideoResize}
                        className="absolute -bottom-3 -right-3 w-6 h-6 bg-white rounded-full border-2 border-blue-500 cursor-nwse-resize flex items-center justify-center touch-none"
                    >
                        <ResizeGripIcon className="w-4 h-4 text-blue-600" />
                    </div>
                 </div>
            )}
        </div>
    );
};
