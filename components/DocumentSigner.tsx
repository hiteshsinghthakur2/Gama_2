import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import LZString from 'lz-string';

export const DocumentSigner: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string>('');
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const sigCanvas = useRef<any>(null);

    useEffect(() => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const encoded = urlParams.get('data');
            if (encoded) {
                const decoded = LZString.decompressFromEncodedURIComponent(encoded);
                if (decoded) {
                    setData(JSON.parse(decoded));
                } else {
                    setError('Invalid or corrupted link.');
                }
            } else {
                setError('No document data found in the link.');
            }
        } catch (e) {
            setError('Failed to load document.');
        }
    }, []);

    const clearSignature = () => {
        sigCanvas.current?.clear();
    };

    const handleSignAndSend = () => {
        if (sigCanvas.current?.isEmpty()) {
            alert('Please provide your signature first.');
            return;
        }
        
        const rawData = sigCanvas.current.toData();
        // Convert to highly compressed vector format
        const vectorData = rawData.map((line: any) => {
            if (!line || !line.points) return [];
            return line.points
                .filter((_: any, i: number) => i % 2 === 0 || i === line.points.length - 1) // Downsample points by half
                .map((p: any) => [Math.round(p.x), Math.round(p.y)]);
        }).filter((l: any[]) => l.length > 0);
        const payload = JSON.stringify({
            v: 1, // version
            w: sigCanvas.current.getCanvas().width,
            h: sigCanvas.current.getCanvas().height,
            l: vectorData // lines
        });
        const compressedSig = LZString.compressToEncodedURIComponent(payload);

        
        const returnUrl = `${window.location.origin}/?receive_signature=1&id=${data.id}&sig=${compressedSig}`;
        
        const fallback = () => {
            const waUrl = `https://wa.me/?text=${encodeURIComponent(`I have signed the Delivery Challan ${data.number}. Click the link to save it:\n\n${returnUrl}`)}`;
            window.open(waUrl, '_blank');
            // Also copy to clipboard just in case popup is blocked
            navigator.clipboard.writeText(returnUrl).then(() => {
                setIsSuccess(true);
            }).catch(() => {
                setIsSuccess(true);
            });
        };

        if (navigator.share && navigator.canShare && navigator.canShare({ url: returnUrl })) {
            navigator.share({
                title: 'Signed Delivery Challan',
                text: `I have signed the Delivery Challan ${data.number}. Click the link to save it:`,
                url: returnUrl
            }).then(() => {
                setIsSuccess(true);
            }).catch((e) => {
                console.error(e);
                if (e.name !== 'AbortError') {
                    fallback();
                }
            });
        } else {
            fallback();
        }
    };

    
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">Document Signed!</h2>
                    <p className="text-gray-600 mb-8">
                        Your signature has been generated. If the return message didn't open automatically, please paste the link you just copied and send it back to the issuer.
                    </p>
                    <button 
                        onClick={() => window.close()}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-xl shadow text-center max-w-sm w-full">
                    <div className="text-red-500 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Oops!</h2>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 md:p-8">
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-indigo-600 p-6 text-white text-center">
                    <h1 className="text-2xl font-bold">Delivery Challan</h1>
                    <p className="opacity-80 mt-1">{data.number} • {data.date}</p>
                </div>
                
                <div className="p-6">
                    <div className="mb-6 pb-6 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
                        <p className="text-lg font-medium text-gray-800">{data.clientName}</p>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Items Included</h3>
                        <div className="space-y-3">
                            {data.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-800">{item.desc}</p>
                                        <p className="text-sm text-gray-500">Qty: {item.qty}</p>
                                    </div>
                                    <p className="font-bold text-gray-800">₹ {item.amt.toLocaleString('en-IN')}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                        <h3 className="text-sm font-bold text-yellow-800 mb-3">Please provide your signature below</h3>
                        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl overflow-hidden relative">
                            <SignatureCanvas 
                                ref={sigCanvas} 
                                penColor="black"
                                canvasProps={{className: "w-full h-48 bg-white cursor-crosshair touch-none"}} 
                            />
                            <button 
                                onClick={clearSignature}
                                className="absolute top-2 right-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={handleSignAndSend}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition text-lg flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Sign & Return Document
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4">
                        By signing, you acknowledge receipt of the items listed above.
                    </p>
                </div>
            </div>
        </div>
    );
};
