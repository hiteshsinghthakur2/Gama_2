import React, { useRef } from 'react';
import { DocumentTemplate } from './DocumentTemplate';
import { Client, AppUser, Invoice, Quotation, DeliveryChallan } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DocumentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: Invoice | Quotation | DeliveryChallan;
    client: Client;
    userProfile: AppUser;
    mode: 'invoice' | 'quotation' | 'delivery-challan';
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
    isOpen,
    onClose,
    document,
    client,
    userProfile,
    mode
}) => {
    const templateRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const handleDownloadPDF = async () => {
        if (!templateRef.current) return;
        try {
            const originalStyle = templateRef.current.style.cssText;
            templateRef.current.style.width = '800px';
            templateRef.current.style.height = 'auto';
            templateRef.current.style.transform = 'none';
            templateRef.current.style.position = 'absolute';
            templateRef.current.style.left = '-9999px';
            templateRef.current.style.top = '0';
            
            const canvas = await html2canvas(templateRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            templateRef.current.style.cssText = originalStyle;

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${document.number}.pdf`);
        } catch (error) {
            console.error('Error generating PDF', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col my-auto" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header Actions */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10 shrink-0">
                    <h2 className="text-lg font-bold text-gray-800">
                        Document Preview: {document.number}
                    </h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm shadow-sm hover:shadow active:scale-95"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download PDF
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="overflow-y-auto p-4 sm:p-8 bg-gray-100/50 flex flex-col justify-start items-center">
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 max-w-[800px] w-full origin-top" ref={templateRef}>
                        <DocumentTemplate 
                            document={document} 
                            userProfile={userProfile} 
                            client={client} 
                            mode={mode} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
