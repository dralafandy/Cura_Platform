import React, { useState, useEffect } from 'react';
import { PatientAttachment } from '../../types';
import { useI18n } from '../../hooks/useI18n';

// Icons
const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

interface ImageViewerModalProps {
    attachments: PatientAttachment[];
    currentIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (index: number) => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
    attachments,
    currentIndex,
    isOpen,
    onClose,
    onNavigate
}) => {
    const { t } = useI18n();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            // Preload image
            const img = new Image();
            img.onload = () => setIsLoading(false);
            img.onerror = () => setIsLoading(false);
            img.src = attachments[currentIndex]?.fileUrl || '';
        }
    }, [currentIndex, attachments, isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            
            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    if (currentIndex > 0) {
                        onNavigate(currentIndex - 1);
                    }
                    break;
                case 'ArrowRight':
                    if (currentIndex < attachments.length - 1) {
                        onNavigate(currentIndex + 1);
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentIndex, attachments.length, onClose, onNavigate]);

    if (!isOpen || !attachments.length) return null;

    const currentAttachment = attachments[currentIndex];
    const isFirstImage = currentIndex === 0;
    const isLastImage = currentIndex === attachments.length - 1;

    const handlePrevious = () => {
        if (!isFirstImage) {
            onNavigate(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (!isLastImage) {
            onNavigate(currentIndex + 1);
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = currentAttachment.fileUrl;
        link.download = currentAttachment.originalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                <div className="flex items-center space-x-4">
                    <h3 className="text-white font-medium truncate max-w-md">
                        {currentAttachment.originalFilename}
                    </h3>
                    <span className="text-slate-300 text-sm">
                        {currentIndex + 1} / {attachments.length}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleDownload}
                        className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                        title={t('common.download')}
                    >
                        <DownloadIcon />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                        title={t('common.close')}
                    >
                        <CloseIcon />
                    </button>
                </div>
            </div>

            {/* Navigation Buttons */}
            {!isFirstImage && (
                <button
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full transition-colors z-10"
                    title={t('common.previous')}
                >
                    <ChevronLeftIcon />
                </button>
            )}

            {!isLastImage && (
                <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 text-white hover:bg-white/20 rounded-full transition-colors z-10"
                    title={t('common.next')}
                >
                    <ChevronRightIcon />
                </button>
            )}

            {/* Image Container */}
            <div className="flex items-center justify-center w-full h-full p-16">
                {isLoading ? (
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                ) : (
                    <img
                        src={currentAttachment.fileUrl}
                        alt={currentAttachment.originalFilename}
                        className="max-w-full max-h-full object-contain"
                        onError={() => setIsLoading(false)}
                    />
                )}
            </div>

            {/* Image Info */}
            {currentAttachment.description && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="max-w-4xl mx-auto">
                        <p className="text-white text-sm">
                            {currentAttachment.description}
                        </p>
                        <p className="text-slate-300 text-xs mt-1">
                            {new Date(currentAttachment.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>
            )}

            {/* Thumbnail Strip */}
            {attachments.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black/50 p-2 rounded-lg max-w-md overflow-x-auto">
                    {attachments.map((attachment, index) => (
                        <button
                            key={attachment.id}
                            onClick={() => onNavigate(index)}
                            className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
                                index === currentIndex
                                    ? 'border-primary'
                                    : 'border-transparent hover:border-white/50'
                            }`}
                        >
                            <img
                                src={attachment.thumbnailUrl || attachment.fileUrl}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Click outside to close */}
            <div
                className="absolute inset-0 -z-10"
                onClick={onClose}
            />
        </div>
    );
};

export default ImageViewerModal;