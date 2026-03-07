import React, { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Patient, PatientAttachment } from '../../types';

// Icons
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const ViewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

interface ImageViewerModalProps {
    isOpen: boolean;
    imageUrl: string;
    fileName: string;
    onClose: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
    isOpen,
    imageUrl,
    fileName,
    onClose,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                >
                    <CloseIcon />
                </button>
                <img
                    src={imageUrl}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain rounded-lg"
                />
                <div className="absolute bottom-4 left-4 right-4 text-white text-center bg-black/50 rounded-lg p-2">
                    <p className="text-sm font-medium">{fileName}</p>
                </div>
            </div>
        </div>
    );
};

interface FormSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    isDark?: boolean;
}

const FormSection: React.FC<FormSectionProps> = ({ title, icon, children, className = '', isDark = false }) => (
    <div className={`bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700 ${className}`}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-primary/20 text-primary-300' : 'bg-primary/10 text-primary'}`}>
                {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">{title}</h3>
        </div>
        {children}
    </div>
);

interface PatientAttachmentsProps {
    patient: Patient;
    attachments?: PatientAttachment[];
    onUpload?: (files: File[], descriptions: string[]) => void;
    onDelete?: (attachmentId: string) => void;
    onView?: (attachment: PatientAttachment) => void;
    className?: string;
}

const PatientAttachments: React.FC<PatientAttachmentsProps> = ({
    patient,
    attachments = [],
    onUpload,
    onDelete,
    onView,
    className = '',
}) => {
    const { t } = useI18n();
    const { isDark } = useTheme();
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{
        url: string;
        fileName: string;
    } | null>(null);

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && onUpload) {
            setIsUploading(true);
            onUpload(Array.from(files), []);
            setIsUploading(false);
        }
    };

    const handleDeleteAttachment = (attachmentId: string) => {
        if (confirm(t('patient_attachments.confirm_delete')) && onDelete) {
            onDelete(attachmentId);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleViewAttachment = (attachment: PatientAttachment) => {
        if (onView) {
            onView(attachment);
        } else {
            setSelectedImage({
                url: attachment.fileUrl,
                fileName: attachment.originalFilename,
            });
        }
    };

    return (
        <div className={className}>
            {/* Header Section */}
            <FormSection title={t('patient_attachments.title')} icon={<ImageIcon />} isDark={isDark}>
                {/* Upload Section */}
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-primary transition-colors bg-white dark:bg-slate-700/30">
                    <div className="space-y-4">
                        <div className="text-slate-400 dark:text-slate-500 flex justify-center">
                            <UploadIcon />
                        </div>

                        <div>
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all duration-200 disabled:opacity-50"
                            >
                                {isUploading ? t('patient_attachments.uploading') : t('patient_attachments.choose_file')}
                                <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('patient_attachments.upload_instructions')}
                        </p>
                    </div>
                </div>

                {/* Attachments Grid */}
                {attachments.length > 0 ? (
                    <div className="mt-6">
                        <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">
                            {t('patient_attachments.attachments_count', { count: attachments.length })}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {attachments.map((attachment) => (
                                <div key={attachment.id} className="relative group">
                                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-primary transition-all duration-200">
                                        <img
                                            src={attachment.fileUrl}
                                            alt={attachment.originalFilename}
                                            className="w-full h-full object-cover cursor-pointer"
                                            onClick={() => handleViewAttachment(attachment)}
                                        />

                                        {/* Overlay with actions */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                                                <button
                                                    onClick={() => handleViewAttachment(attachment)}
                                                    className="p-2 bg-white dark:bg-slate-700 rounded-full text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors shadow-lg"
                                                    title={t('patient_attachments.view')}
                                                >
                                                    <ViewIcon />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteAttachment(attachment.id)}
                                                    className="p-2 bg-white dark:bg-slate-700 rounded-full text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-lg"
                                                    title={t('patient_attachments.delete')}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* File Info */}
                                    <div className="mt-2 text-xs">
                                        <p className="truncate font-medium text-slate-700 dark:text-slate-300">
                                            {attachment.originalFilename}
                                        </p>
                                        <p className="text-slate-400 dark:text-slate-500">
                                            {formatFileSize(attachment.fileSize)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 text-center py-8 bg-slate-100 dark:bg-slate-700/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                        <div className="text-slate-400 dark:text-slate-500 flex justify-center mb-3">
                            <ImageIcon />
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                            {t('patient_attachments.no_attachments')}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                            {t('patient_attachments.upload_first')}
                        </p>
                    </div>
                )}
            </FormSection>

            {/* Image Viewer Modal */}
            <ImageViewerModal
                isOpen={!!selectedImage}
                imageUrl={selectedImage?.url || ''}
                fileName={selectedImage?.fileName || ''}
                onClose={() => setSelectedImage(null)}
            />
        </div>
    );
};

export default PatientAttachments;
