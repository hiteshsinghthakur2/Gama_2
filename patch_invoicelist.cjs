const fs = require('fs');
let content = fs.readFileSync('components/InvoiceList.tsx', 'utf-8');

// add imports
if (!content.includes("import * as XLSX")) {
    content = content.replace("import React, { useState, useEffect, useMemo } from 'react';", 
    "import React, { useState, useEffect, useMemo } from 'react';\nimport * as XLSX from 'xlsx';\nimport jsPDF from 'jspdf';\nimport autoTable from 'jspdf-autotable';");
}

// add functions
const functionsToAdd = `
  const handleExportExcelReport = () => {
    const docs = invoices.filter(inv => selectedIds.includes(inv.id));
    if (docs.length === 0) return;

    const data = docs.map(inv => ({
      'Invoice No': inv.number,
      'Date': inv.date,
      'Due Date': inv.dueDate,
      'Client': getClient(inv.clientId, inv)?.name || 'Unknown',
      'Status': inv.status,
      'Total Amount': calculateDocumentTotal(inv),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices Report");
    XLSX.writeFile(wb, \`Invoices_Report_\${new Date().toISOString().split('T')[0]}.xlsx\`);
  };

  const handleExportPDFReport = () => {
    const docs = invoices.filter(inv => selectedIds.includes(inv.id));
    if (docs.length === 0) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Invoices Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(\`Generated on: \${new Date().toLocaleDateString()}\`, 14, 30);
    doc.text(\`Total Invoices: \${docs.length}\`, 14, 36);

    const totalAmount = docs.reduce((sum, inv) => sum + calculateDocumentTotal(inv), 0);
    doc.text(\`Total Amount: \${formatCurrency(totalAmount)}\`, 14, 42);

    const tableColumn = ["Invoice No", "Date", "Client", "Status", "Amount"];
    const tableRows = docs.map(inv => [
      inv.number,
      inv.date,
      getClient(inv.clientId, inv)?.name || 'Unknown',
      inv.status,
      formatCurrency(calculateDocumentTotal(inv))
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(\`Invoices_Report_\${new Date().toISOString().split('T')[0]}.pdf\`);
  };
`;

if (!content.includes('handleExportExcelReport')) {
    content = content.replace("const handleBulkShare", functionsToAdd + "\n  const handleBulkShare");
}

// Add UI buttons
const uiToAdd = `
                <button onClick={handleExportExcelReport} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-green-700 flex items-center gap-2 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Report (Excel)
                </button>
                <button onClick={handleExportPDFReport} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-red-700 flex items-center gap-2 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Report (PDF)
                </button>
`;

if (!content.includes('Report (Excel)')) {
    content = content.replace('<button onClick={() => handleBulkShare(\'drive\')}', uiToAdd + '                <button onClick={() => handleBulkShare(\'drive\')}');
}

fs.writeFileSync('components/InvoiceList.tsx', content);
