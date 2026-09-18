const fs = require('fs');
let content = fs.readFileSync('components/DocumentTemplate.tsx', 'utf-8');

const authSigCode = `                <div className="\${hideAmounts ? 'mt-0' : 'mt-8'} text-right">
                    <p className="font-bold text-gray-900 mb-2">{userProfile.companyName}</p>
                    {userProfile.signatureUrl ? (
                        <div className="flex justify-end mb-2">
                            <img src={userProfile.signatureUrl} alt="Signature" className="h-16 object-contain" />
                        </div>
                    ) : (
                        <div className="h-16 mb-2"></div>
                    )}
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider border-t border-gray-200 inline-block pt-2 px-8">Authorized Signatory</p>
                </div>`;

const newSigCode = `                <div className={\`\${hideAmounts ? 'mt-0' : 'mt-8'} flex justify-between items-end\`}>
                    {/* Receiver Signature (if Delivery Challan and signed) */}
                    {isDeliveryChallan && (document as any).signatureUrl ? (
                        <div className="text-left">
                            <p className="font-bold text-gray-900 mb-2">Received By</p>
                            <div className="flex justify-start mb-2">
                                <img src={(document as any).signatureUrl} alt="Receiver Signature" className="h-16 object-contain" />
                            </div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider border-t border-gray-200 inline-block pt-2 px-8">{client?.name || 'Receiver'}</p>
                        </div>
                    ) : (
                        <div></div>
                    )}

                    {/* Authorized Signatory */}
                    <div className="text-right">
                        <p className="font-bold text-gray-900 mb-2">{userProfile.companyName}</p>
                        {userProfile.signatureUrl ? (
                            <div className="flex justify-end mb-2">
                                <img src={userProfile.signatureUrl} alt="Signature" className="h-16 object-contain" />
                            </div>
                        ) : (
                            <div className="h-16 mb-2"></div>
                        )}
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider border-t border-gray-200 inline-block pt-2 px-8">Authorized Signatory</p>
                    </div>
                </div>`;

content = content.replace(authSigCode, newSigCode);

fs.writeFileSync('components/DocumentTemplate.tsx', content);
