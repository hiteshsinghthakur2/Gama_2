import React, { useMemo } from 'react';
import { Invoice, Quotation, UserBusinessProfile, Client, LineItem, CustomField, AdditionalCharge } from '../types';
import { calculateLineItem, numberToWords } from '../services/Calculations';
import { INDIAN_STATES, CRAFT_DADDY_LOGO_SVG } from '../constants';

interface DocumentTemplateProps {
  document: Invoice | Quotation;
  userProfile: UserBusinessProfile;
  client?: Client;
  mode: 'invoice' | 'quotation';
}

export const DocumentTemplate: React.FC<DocumentTemplateProps> = ({ document, userProfile, client, mode }) => {
  const isQuotation = mode === 'quotation';

  // Calculate Interstate logic locally for template
  const isInterState = useMemo(() => {
    const supplyStateMatch = document.placeOfSupply.match(/\((\d+)\)/);
    const supplyStateCode = supplyStateMatch ? supplyStateMatch[1] : null;
    const userStateCode = userProfile.address.stateCode;

    if (supplyStateCode && userStateCode) {
        return parseInt(supplyStateCode, 10) !== parseInt(userStateCode, 10);
    }
    const posLower = document.placeOfSupply.toLowerCase().trim();
    const userStateLower = userProfile.address.state.toLowerCase().trim();
    if (posLower && userStateLower) {
        if (posLower.includes(userStateLower)) return false;
        return true; 
    }
    return false;
  }, [document.placeOfSupply, userProfile]);

  const totals = useMemo(() => {
    const itemTotals = (document.items || []).reduce((acc: any, item: LineItem) => {
      const calc = calculateLineItem(item, !!isInterState);
      return {
        taxable: acc.taxable + calc.taxableValue,
        cgst: acc.cgst + calc.cgst,
        sgst: acc.sgst + calc.sgst,
        igst: acc.igst + calc.igst,
        total: acc.total + calc.total
      };
    }, { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });

    let discountAmount = 0;
    if (document.discountValue) {
      if (document.discountType === 'percentage') {
        discountAmount = (itemTotals.taxable * document.discountValue) / 100;
      } else {
        discountAmount = document.discountValue;
      }
    }

    const additionalChargesTotal = (document.additionalCharges || []).reduce((sum: number, charge: AdditionalCharge) => sum + (charge.amount || 0), 0);
    const preRoundTotal = itemTotals.total - discountAmount + additionalChargesTotal;
    const finalTotal = preRoundTotal + (document.roundOff || 0);

    return { ...itemTotals, discountAmount, additionalChargesTotal, finalTotal };
  }, [document.items, isInterState, document.discountType, document.discountValue, document.additionalCharges, document.roundOff]);

  return (
    <div className="bg-white text-black p-8 font-sans w-[210mm] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-medium text-[#5c2c90] mb-4">
                    {isQuotation ? 'Quotation' : 'Tax Invoice'}
                </h1>
                <div className="grid grid-cols-[100px_1fr] gap-y-1 text-sm">
                    <span className="text-gray-500 font-medium">{isQuotation ? 'Quotation No #' : 'Invoice No #'}</span>
                    <span className="font-bold text-gray-900">{document.number}</span>
                    
                    <span className="text-gray-500 font-medium">{isQuotation ? 'Date' : 'Invoice Date'}</span>
                    <span className="font-bold text-gray-900">{new Date(document.date).toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                    
                    {document.dueDate && (
                        <>
                            <span className="text-gray-500 font-medium">{isQuotation ? 'Valid Till' : 'Due Date'}</span>
                            <span className="font-bold text-gray-900">{new Date(document.dueDate).toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                        </>
                    )}
                    
                    {document.customFields?.map((field: CustomField, i: number) => (
                        <React.Fragment key={i}>
                            <span className="text-gray-500 font-medium">{field.label}</span>
                            <span className="font-bold text-gray-900">{field.value}</span>
                        </React.Fragment>
                    ))}
                </div>
            </div>
            <div className="w-64 flex justify-end">
                <img src={userProfile.logoUrl || CRAFT_DADDY_LOGO_SVG} className="max-w-full object-contain max-h-24" alt="Logo" />
            </div>
        </div>

        {/* Billing Boxes */}
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-[#f8f5ff] p-3 rounded-sm">
                <h3 className="text-[#5c2c90] font-bold text-lg mb-2">{isQuotation ? 'Quotation From' : 'Billed By'}</h3>
                <div className="text-sm space-y-1 text-gray-800">
                    <p className="font-bold">{userProfile.companyName}</p>
                    <p className="whitespace-pre-line">{userProfile.address.street},</p>
                    <p>{userProfile.address.city},</p>
                    <p>{userProfile.address.state}, {userProfile.address.country} - {userProfile.address.pincode}</p>
                    <p className="mt-2"><span className="font-bold">GSTIN:</span> <span className="text-[#5c2c90]">{userProfile.gstin}</span></p>
                    <p><span className="font-bold">PAN:</span> {userProfile.pan}</p>
                </div>
            </div>
            
            <div className="bg-[#f8f5ff] p-3 rounded-sm">
                <h3 className="text-[#5c2c90] font-bold text-lg mb-2">{isQuotation ? 'Quotation For' : 'Billed To'}</h3>
                <div className="text-sm space-y-1 text-gray-800">
                    <p className="font-bold uppercase">{client?.name}</p>
                    <p className="uppercase">{client?.address.street},</p>
                    <p className="uppercase">{client?.address.city}, {client?.address.state},</p>
                    <p className="uppercase">{client?.address.country} - {client?.address.pincode}</p>
                    <p className="mt-2"><span className="font-bold">GSTIN:</span> <span className="text-[#5c2c90]">{client?.gstin || 'N/A'}</span></p>
                </div>
            </div>
        </div>

        {/* Supply Place */}
        <div className="flex justify-between items-center px-2 mb-4 text-sm">
            <div>Country of Supply: <span className="font-bold text-gray-900">India</span></div>
            <div>Place of Supply: <span className="font-bold text-[#5c2c90]">{document.placeOfSupply}</span></div>
        </div>

        {/* Table */}
        <table className="w-full mb-4 border-collapse table-fixed">
            <thead className="bg-[#5c2c90] text-white">
                <tr>
                    <th className="py-2 px-2 text-left text-xs font-bold uppercase tracking-wider w-[25%]">Item</th>
                    <th className="py-2 px-1 text-center text-xs font-bold uppercase tracking-wider w-[10%]">HSN/SAC</th>
                    <th className="py-2 px-1 text-center text-xs font-bold uppercase tracking-wider w-[5%]">GST</th>
                    <th className="py-2 px-1 text-center text-xs font-bold uppercase tracking-wider w-[5%]">Qty</th>
                    <th className="py-2 px-1 text-right text-xs font-bold uppercase tracking-wider w-[10%]">Rate</th>
                    <th className="py-2 px-1 text-right text-xs font-bold uppercase tracking-wider w-[15%]">Taxable</th>
                    {isInterState ? (
                        <th className="py-2 px-1 text-right text-xs font-bold uppercase tracking-wider w-[15%]">IGST</th>
                    ) : (
                        <>
                        <th className="py-2 px-1 text-right text-xs font-bold uppercase tracking-wider w-[10%]">CGST</th>
                        <th className="py-2 px-1 text-right text-xs font-bold uppercase tracking-wider w-[10%]">SGST</th>
                        </>
                    )}
                    <th className="py-2 px-2 text-right text-xs font-bold uppercase tracking-wider w-[15%]">Total</th>
                </tr>
            </thead>
            <tbody className="text-xs">
                {document.items.map((item: LineItem) => {
                    const calc = calculateLineItem(item, !!isInterState);
                    return (
                        <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-2 px-2"><div className="font-bold text-gray-800">{item.description}</div></td>
                            <td className="py-2 px-1 text-center text-gray-600">{item.hsn}</td>
                            <td className="py-2 px-1 text-center">{item.taxRate}%</td>
                            <td className="py-2 px-1 text-center font-medium">{item.qty}</td>
                            <td className="py-2 px-1 text-right">₹{item.rate}</td>
                            <td className="py-2 px-1 text-right font-medium">₹{calc.taxableValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                            {isInterState ? (
                                <td className="py-2 px-1 text-right text-gray-600">₹{calc.igst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                            ) : (
                                <>
                                <td className="py-2 px-1 text-right text-gray-600">₹{calc.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                <td className="py-2 px-1 text-right text-gray-600">₹{calc.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                </>
                            )}
                            <td className="py-2 px-2 text-right font-bold text-gray-900">₹{calc.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>

        {/* Total in Words */}
        <div className="mb-4 border-b border-t border-gray-100 py-2 bg-gray-50/30">
            <p className="text-sm text-gray-700">Total in words: <span className="font-bold text-gray-900 capitalize italic">{numberToWords(Math.round(totals.finalTotal))}</span></p>
        </div>

        {/* Lower Section */}
        <div className="grid grid-cols-2 gap-8 mb-4 items-start">
            <div className="space-y-4">
                {document.showBankDetails && (
                <div className="bg-gray-50 p-4 rounded border border-gray-100">
                    <h3 className="text-[#5c2c90] font-bold text-sm mb-3 border-b border-gray-200 pb-2">BANK DETAILS</h3>
                    <div className="grid grid-cols-[100px_1fr] gap-y-1 text-sm">
                        <span className="text-gray-500">Account Name</span>
                        <span className="font-bold text-gray-900">{document.bankDetails?.accountName}</span>
                        <span className="text-gray-500">Account No.</span>
                        <span className="font-bold text-gray-900">{document.bankDetails?.accountNumber}</span>
                        <span className="text-gray-500">IFSC Code</span>
                        <span className="font-bold text-gray-900">{document.bankDetails?.ifscCode}</span>
                        <span className="text-gray-500">Bank Name</span>
                        <span className="font-bold text-gray-900">{document.bankDetails?.bankName}</span>
                    </div>
                </div>
                )}
                <div>
                    <h4 className="font-bold text-gray-800 text-sm mb-2 uppercase">Terms and Conditions</h4>
                    <div className="text-xs text-gray-500 space-y-1 leading-relaxed">
                        {document.terms?.split('\n').map((term: string, i: number) => (
                        <p key={i} className="flex gap-2">
                            <span className="text-gray-400">{i+1}.</span>
                            <span>{term.replace(/^\d+\.\s*/, '')}</span>
                        </p>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col">
                <div className="space-y-2 text-sm border-b border-gray-200 pb-2">
                    <div className="flex justify-between text-gray-600">
                        <span>Taxable Amount</span>
                        <span className="font-medium">₹{totals.taxable.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    {isInterState ? (
                         <div className="flex justify-between text-gray-600">
                            <span>IGST</span>
                            <span className="font-medium">₹{totals.igst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                    ) : (
                        <>
                         <div className="flex justify-between text-gray-600">
                            <span>CGST</span>
                            <span className="font-medium">₹{totals.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>SGST</span>
                            <span className="font-medium">₹{totals.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                        </>
                    )}
                    {totals.additionalChargesTotal > 0 && (
                        <div className="flex justify-between text-gray-600">
                            <span>Addl. Charges</span>
                            <span className="font-medium">₹{totals.additionalChargesTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                    )}
                    {totals.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                            <span>Discount</span>
                            <span className="font-medium">- ₹{totals.discountAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                    )}
                    {document.roundOff !== 0 && (
                        <div className="flex justify-between text-gray-400 italic">
                            <span>Round Off</span>
                            <span>{document.roundOff > 0 ? '+' : ''} ₹{document.roundOff?.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center py-2 bg-[#f8f5ff] -mx-4 px-4 mt-2 rounded">
                    <span className="text-[#5c2c90] font-bold text-lg">Total Amount</span>
                    <span className="text-[#5c2c90] font-bold text-xl">₹{totals.finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                
                <div className="mt-8 text-right">
                    <p className="font-bold text-gray-900 mb-6">{userProfile.companyName}</p>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider border-t border-gray-200 inline-block pt-2 px-8">Authorized Signatory</p>
                </div>
            </div>
        </div>

        <div className="mt-auto pt-4 pb-2 text-center">
            <p className="text-xs text-gray-500 mb-2">This is an electronically generated document, no signature is required.</p>
        </div>
    </div>
  );
};