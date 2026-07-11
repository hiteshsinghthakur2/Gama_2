import * as XLSX from 'xlsx';

export const generateMasterBackupBlob = (): Blob => {
  const getLocalDataArray = (key: string) => {
    const item = localStorage.getItem(key);
    if (!item) return [];
    try {
      const parsed = JSON.parse(item);
      return parsed.data !== undefined ? parsed.data : parsed;
    } catch(e) { return []; }
  };

  const wb = XLSX.utils.book_new();
  
  const invoices = getLocalDataArray('bos_cloud_invoices');
  if(invoices.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoices), "Invoices");
  
  const clients = getLocalDataArray('bos_cloud_clients');
  if(clients.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clients), "Clients");
  
  const leads = getLocalDataArray('bos_cloud_leads');
  if(leads.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leads), "Leads");
  
  const quotes = getLocalDataArray('bos_cloud_quotations');
  if(quotes.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(quotes), "Quotations");
  
  const challans = getLocalDataArray('bos_cloud_delivery_challans');
  if(challans.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(challans), "Delivery Challans");

  if (wb.SheetNames.length === 0) { 
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Message: "No data found to backup" }]), "Backup");
  }
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: "application/octet-stream" });
};
