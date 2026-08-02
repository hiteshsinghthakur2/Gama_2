const fs = require('fs');
let content = fs.readFileSync('components/DocumentTemplate.tsx', 'utf-8');

const bankDetailsEndStr = `                {(document as any).showBankDetails && (
                <div className="bg-gray-50 p-4 rounded border border-gray-100">
                    <h3 className="text-[#5c2c90] font-bold text-sm mb-3 border-b border-gray-200 pb-2">BANK DETAILS</h3>
                    <div className="grid grid-cols-[100px_1fr] gap-y-1 text-sm">
                        <span className="text-gray-500">Account Name</span>
                        <span className="font-bold text-gray-900">{(document as any).bankDetails?.accountName}</span>
                        <span className="text-gray-500">Account No</span>
                        <span className="font-bold text-gray-900">{(document as any).bankDetails?.accountNumber}</span>
                        <span className="text-gray-500">IFSC Code</span>
                        <span className="font-bold text-gray-900">{(document as any).bankDetails?.ifscCode}</span>
                        <span className="text-gray-500">Bank Name</span>
                        <span className="font-bold text-gray-900">{(document as any).bankDetails?.bankName}</span>
                    </div>
                </div>
                )}`;

const newBankDetailsStr = bankDetailsEndStr + `
                {/* Payment Details */
                 !isQuotation && !isDeliveryChallan && (document as Invoice).status === 'Paid' && ((document as Invoice).paymentReference || (document as Invoice).paymentDate) && (
                <div className="bg-emerald-50 p-4 rounded border border-emerald-100 mt-4">
                    <h3 className="text-emerald-700 font-bold text-sm mb-3 border-b border-emerald-200 pb-2">PAYMENT RECEIVED</h3>
                    <div className="grid grid-cols-[100px_1fr] gap-y-1 text-sm">
                        {(document as Invoice).paymentDate && (
                            <>
                                <span className="text-emerald-600">Date</span>
                                <span className="font-bold text-emerald-900">{new Date((document as Invoice).paymentDate!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </>
                        )}
                        {(document as Invoice).paymentReference && (
                            <>
                                <span className="text-emerald-600">Ref / UTR</span>
                                <span className="font-bold text-emerald-900">{(document as Invoice).paymentReference}</span>
                            </>
                        )}
                    </div>
                </div>
                )}`;
content = content.replace(bankDetailsEndStr, newBankDetailsStr);

fs.writeFileSync('components/DocumentTemplate.tsx', content);
console.log('Patched DocumentTemplate.tsx');
