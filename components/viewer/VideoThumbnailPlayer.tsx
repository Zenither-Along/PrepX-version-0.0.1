import React, { useState, useRef, useEffect } from 'react';
import { PlayCircleIcon } from '../icons';

export const VideoThumbnailPlayer: React.FC<{ url: string | undefined }> = ({ url }) => {
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [videoTitle, setVideoTitle] = useState<string>('Watch video');
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;
        const currentRef = containerRef.current;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // Disconnect the observer to fetch only once
                    observer.disconnect();

                    const fetchThumbnail = async () => {
                        if (!url || typeof url !== 'string') {
                            if (isMounted) {
                                setThumbnailUrl(null);
                                setIsLoading(false);
                            }
                            return;
                        }

                        // YouTube
                        let match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                        if (match && match[1]) {
                            if (isMounted) {
                                setThumbnailUrl(`https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`);
                                setVideoTitle('Watch on YouTube');
                                setIsLoading(false);
                            }
                            return;
                        }

                        // Vimeo
                        match = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:video\/)?(\d+)/);
                        if (match && match[1]) {
                            try {
                                const response = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
                                if (!response.ok) throw new Error('Vimeo API error');
                                const data = await response.json();
                                if (isMounted) {
                                    setThumbnailUrl(data.thumbnail_url);
                                    setVideoTitle(data.title || 'Watch on Vimeo');
                                }
                            } catch (error) {
                                console.error("Failed to fetch Vimeo thumbnail", error);
                                if (isMounted) setThumbnailUrl(null);
                            } finally {
                                if (isMounted) setIsLoading(false);
                            }
                            return;
                        }
                        
                        if (isMounted) {
                            setThumbnailUrl(null);
                            setIsLoading(false);
                        }
                    };

                    fetchThumbnail();
                }
            },
            { rootMargin: '200px 0px' }
        );

        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            isMounted = false;
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [url]);

    return (
        <div ref={containerRef}>
            {isLoading ? (
                <div className="block w-full aspect-video bg-gray-200 animate-pulse rounded-md" />
            ) : !thumbnailUrl ? (
                <div className="px-4 py-2 my-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800">
                    <p className="font-bold">Cannot display video</p>
                    {url ? (
                        <p className="text-sm">Please provide a valid YouTube or Vimeo URL. Current: <code className="break-all">{url}</code></p>
                    ) : (
                        <p className="text-sm">No video URL has been provided. Please edit the path to add one.</p>
                    )}
                </div>
            ) : (
                <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full aspect-video bg-black group relative">
                    <img src={thumbnailUrl} alt={videoTitle} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity opacity-100 group-hover:opacity-100">
                        <PlayCircleIcon className="w-16 h-16 text-white/80" />
                    </div>
                </a>
            )}
        </div>
    );
};
