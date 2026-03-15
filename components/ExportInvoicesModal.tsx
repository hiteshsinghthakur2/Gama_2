import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { Invoice, Client, UserBusinessProfile, InvoiceStatus } from '../types';
import { DocumentTemplate } from './DocumentTemplate';

interface ExportInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  clients: Client[];
  userProfile: UserBusinessProfile;
}

const ExportInvoicesModal: React.FC<ExportInvoicesModalProps> = ({ isOpen, onClose, invoices, clients, userProfile }) => {
  const [exportType, setExportType] = useState<'all' | 'month' | 'year' | 'range' | 'client' | 'status' | 'selection'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | ''>('');
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentExportInvoice, setCurrentExportInvoice] = useState<Invoice | null>(null);

  // Generate years list (e.g., last 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (!isOpen) return null;

  const handleExport = async () => {
    let filteredInvoices = invoices;

    if (exportType === 'month') {
      filteredInvoices = invoices.filter(inv => {
        const date = new Date(inv.date);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      });
    } else if (exportType === 'year') {
      filteredInvoices = invoices.filter(inv => {
        const date = new Date(inv.date);
        return date.getFullYear() === selectedYear;
      });
    } else if (exportType === 'range') {
      if (!startDate || !endDate) {
        alert('Please select both start and end dates.');
        return;
      }
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      filteredInvoices = invoices.filter(inv => {
        const time = new Date(inv.date).getTime();
        return time >= start && time <= end;
      });
    } else if (exportType === 'client') {
      if (!selectedClientId) {
        alert('Please select a client.');
        return;
      }
      filteredInvoices = invoices.filter(inv => inv.clientId === selectedClientId);
    } else if (exportType === 'status') {
      if (!selectedStatus) {
        alert('Please select a status.');
        return;
      }
      filteredInvoices = invoices.filter(inv => inv.status === selectedStatus);
    } else if (exportType === 'selection') {
      if (selectedInvoiceIds.length === 0) {
        alert('Please select at least one invoice.');
        return;
      }
      filteredInvoices = invoices.filter(inv => selectedInvoiceIds.includes(inv.id));
    }

    if (filteredInvoices.length === 0) {
      alert('No invoices found for the selected criteria.');
      return;
    }

    setIsExporting(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const folder = zip.folder("Invoices");

      for (let i = 0; i < filteredInvoices.length; i++) {
        const inv = filteredInvoices[i];
        setCurrentExportInvoice(inv);
        
        // Wait for React to render the template
        await new Promise(resolve => setTimeout(resolve, 800));

        const element = document.getElementById('export-template-container');
        if (!element || !(window as any).html2pdf) {
          throw new Error("PDF generator library not loaded or template missing.");
        }

        const opt = {
          margin: 12.7,
          filename: `Invoice-${inv.number}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const pdfBlob = await (window as any).html2pdf().set(opt).from(element).outputPdf('blob');
        folder?.file(`Invoice-${inv.number}.pdf`, pdfBlob);
        
        setProgress(Math.round(((i + 1) / filteredInvoices.length) * 100));
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      
      let zipName = 'Invoices_Export.zip';
      if (exportType === 'month') zipName = `Invoices_${months[selectedMonth]}_${selectedYear}.zip`;
      if (exportType === 'year') zipName = `Invoices_${selectedYear}.zip`;
      if (exportType === 'range') zipName = `Invoices_${startDate}_to_${endDate}.zip`;
      if (exportType === 'client') {
        const client = clients.find(c => c.id === selectedClientId);
        zipName = `Invoices_${client?.name || 'Client'}.zip`;
      }
      if (exportType === 'status') zipName = `Invoices_Status_${selectedStatus}.zip`;
      if (exportType === 'selection') zipName = `Invoices_Selected_${filteredInvoices.length}.zip`;
      
      a.download = zipName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Export failed:", error);
      alert("An error occurred during export. Please try again.");
    } finally {
      setIsExporting(false);
      setCurrentExportInvoice(null);
      setProgress(0);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Export Invoices</h2>
          {!isExporting && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {isExporting ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Generating PDFs...</h3>
              <p className="text-sm text-gray-500 mb-4">Please do not close this window.</p>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-xs font-bold text-indigo-600 mt-2">{progress}% Complete</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Export Criteria</label>
                <select 
                  value={exportType} 
                  onChange={(e) => setExportType(e.target.value as any)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                >
                  <option value="all">All Invoices</option>
                  <option value="month">Month-wise</option>
                  <option value="year">Year-wise</option>
                  <option value="range">Date Range</option>
                  <option value="client">By Client</option>
                  <option value="status">By Lifecycle (Status)</option>
                  <option value="selection">Multiple Selection</option>
                </select>
              </div>

              {exportType === 'client' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Client</label>
                  <select 
                    value={selectedClientId} 
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    <option value="">Choose a client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {exportType === 'status' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Status</label>
                  <select 
                    value={selectedStatus} 
                    onChange={(e) => setSelectedStatus(e.target.value as InvoiceStatus)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    <option value="">Choose a status...</option>
                    {Object.values(InvoiceStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              )}

              {exportType === 'selection' && (
                <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-100 rounded-xl bg-gray-50">
                  <div className="flex justify-between items-center mb-2 px-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Select Invoices</span>
                    <button 
                      onClick={() => {
                        if (selectedInvoiceIds.length === invoices.length) {
                          setSelectedInvoiceIds([]);
                        } else {
                          setSelectedInvoiceIds(invoices.map(inv => inv.id));
                        }
                      }}
                      className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                    >
                      {selectedInvoiceIds.length === invoices.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  {invoices.map(inv => (
                    <label key={inv.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition cursor-pointer border border-transparent hover:border-gray-200">
                      <input 
                        type="checkbox" 
                        checked={selectedInvoiceIds.includes(inv.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInvoiceIds([...selectedInvoiceIds, inv.id]);
                          } else {
                            setSelectedInvoiceIds(selectedInvoiceIds.filter(id => id !== inv.id));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-grow">
                        <div className="text-sm font-bold text-gray-900">{inv.number}</div>
                        <div className="text-[10px] text-gray-500 flex justify-between">
                          <span>{new Date(inv.date).toLocaleDateString()}</span>
                          <span>{clients.find(c => c.id === inv.clientId)?.name}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {exportType === 'month' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Month</label>
                    <select 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    >
                      {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Year</label>
                    <select 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    >
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {exportType === 'year' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Year</label>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}

              {exportType === 'range' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleExport}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download ZIP
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hidden container for PDF generation */}
      {currentExportInvoice && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '210mm' }}>
          <div id="export-template-container" className="bg-white text-black p-0 m-0 font-sans">
            <DocumentTemplate 
              document={currentExportInvoice} 
              userProfile={userProfile} 
              client={clients.find(c => c.id === currentExportInvoice.clientId)} 
              mode="invoice" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportInvoicesModal;
