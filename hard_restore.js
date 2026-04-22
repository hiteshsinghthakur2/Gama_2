const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const strictOldhandleUploadBill = `  const handleUploadBill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingBill(true);
    setUploadProgress({ current: 0, total: files.length });
    
    let strictlyNew: Invoice[] = [];
    let conflicting: { parsed: Invoice; existing: Invoice }[] = [];
    let updatedClients = [...clients];
    let clientsChanged = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length });
      
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const parseResult = await parseInvoiceFromImage(base64Data, file.type);
        
        if (parseResult && parseResult.success) {
          const parsedData = parseResult.data;
          
          const normalizeString = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

          let clientId = '';

          if (parsedData.clientName) {
            const pName = normalizeString(parsedData.clientName);
            const pGstin = normalizeString(parsedData.clientGstin);
            const pPhone = normalizeString(parsedData.clientPhone);
            
            const addr = parsedData.clientAddress || {};
            const pStreet = normalizeString(addr.street);
            const pCity = normalizeString(addr.city);

            let matchedClient = updatedClients.find(c => {
               const cName = normalizeString(c.name);
               const cGstin = normalizeString(c.gstin);
               const cPhone = normalizeString(c.phone);
               const cStreet = normalizeString(c.address?.street);
               const cCity = normalizeString(c.address?.city);
               
               if (cName !== pName) return false;
               if (pGstin && cGstin && pGstin !== cGstin) return false;
               if (pPhone && cPhone && pPhone !== cPhone) return false;
               
               if (pStreet && cStreet && !cStreet.includes(pStreet.substring(0, 10)) && !pStreet.includes(cStreet.substring(0, 10))) return false;
               if (pCity && cCity && pCity !== cCity) return false;

               return true;
            });

            if (matchedClient) {
              clientId = matchedClient.id;
            } else {
              let finalStreet = typeof addr === 'string' ? addr : addr.street || '';
              
              const newClient: Client = {
                id: \`client-\${Date.now()}-\${i}\`,
                name: parsedData.clientName,
                email: parsedData.clientEmail || '',
                phone: parsedData.clientPhone || '',
                address: {
                  street: finalStreet,
                  city: addr.city || '',
                  state: addr.state || parsedData.placeOfSupply || '',
                  stateCode: '',
                  pincode: addr.pincode || '',
                  country: addr.country || 'India'
                },
                gstin: parsedData.clientGstin || '',
                pan: parsedData.clientPan || ''
              };
              
              if (parsedData.clientRegistered && !newClient.gstin) {
                 newClient.customFields = [{ label: 'Status', value: 'Registered (GSTIN Missing)' }];
              } else if (!parsedData.clientRegistered && !newClient.gstin) {
                 newClient.customFields = [{ label: 'Status', value: 'Non-Registered' }];
              }

              updatedClients.push(newClient);
              clientId = newClient.id;
              clientsChanged = true;
            }
          }

          if (!clientId) {
            const unknownClient: Client = {
              id: \`client-unknown-\${Date.now()}-\${i}\`,
              name: 'Unknown Client',
              email: '',
              address: { street: '', city: '', state: '', stateCode: '', pincode: '', country: 'India' }
            };
            updatedClients.push(unknownClient);
            clientId = unknownClient.id;
            clientsChanged = true;
          }

          const parsedNumber = parsedData.number;
          const newNumber = parsedNumber || \`CD\${new Date().getFullYear()}\${Math.floor(1000 + Math.random() * 9000)}\`;

          const newInvoice: Invoice = {
            id: \`inv-\${Date.now()}-\${i}\`,
            number: newNumber,
            date: parsedData.date || new Date().toISOString().split('T')[0],
            dueDate: parsedData.dueDate || '',
            status: InvoiceStatus.DRAFT,
            clientId: clientId,
            items: parsedData.items && parsedData.items.length > 0 ? parsedData.items.map((item: any, index: number) => ({
              id: \`item-\${Date.now()}-\${i}-\${index}\`,
              description: item.description || '',
              hsn: item.hsn || '',
              qty: item.qty || 1,
              rate: item.rate || 0,
              taxRate: item.taxRate || 18
            })) : [{ id: '1', description: '', hsn: '', qty: 1, rate: 0, taxRate: 18 }],
            additionalCharges: parsedData.additionalCharges && parsedData.additionalCharges.length > 0 ? parsedData.additionalCharges.map((charge: any, index: number) => ({
              id: \`charge-\${Date.now()}-\${i}-\${index}\`,
              label: charge.label || 'Additional Charge',
              amount: charge.amount || 0
            })) : undefined,
            placeOfSupply: parsedData.placeOfSupply || \`\${userProfile.address.state} (\${userProfile.address.stateCode})\`,
            bankDetails: userProfile.bankAccounts[0],
            terms: parsedData.termsAndConditions || userProfile.defaultInvoiceTerms || '1. Subject to local jurisdiction.\\n2. Payment within due date.'
          };

          let existing;
          if (parsedNumber) {
            existing = invoices.find(inv => 
              inv.number.toLowerCase() === parsedNumber.toLowerCase() && 
              inv.clientId === clientId
            );
          }
          
          if (existing) {
            conflicting.push({ parsed: newInvoice, existing });
          } else {
            strictlyNew.push(newInvoice);
          }
        } else {
          console.warn(\`Could not extract details from file: \${file.name}\`);
          conflicting.push({ 
            parsed: { id: \`err-\${Date.now()}\`, number: \`Error: \${file.name}\`, date: '', status: InvoiceStatus.DRAFT, clientId: '', items: [], placeOfSupply: '', bankDetails: userProfile.bankAccounts[0] } as Invoice, 
            existing: { id: \`msg-\${Date.now()}\`, number: \`Extraction Failed: \${parseResult?.error || 'Unknown error'}\`, date: '', status: InvoiceStatus.DRAFT, clientId: '', items: [], placeOfSupply: '', bankDetails: userProfile.bankAccounts[0] } as Invoice
          });
        }
      } catch (error) {
        console.error(\`Error processing file \${file.name}:\`, error);
        conflicting.push({ 
            parsed: { id: \`err-\${Date.now()}\`, number: \`Error: \${file.name}\`, date: '', status: InvoiceStatus.DRAFT, clientId: '', items: [], placeOfSupply: '', bankDetails: userProfile.bankAccounts[0] } as Invoice, 
            existing: { id: \`msg-\${Date.now()}\`, number: \`Processing Error: \${(error as any)?.message || error}\`, date: '', status: InvoiceStatus.DRAFT, clientId: '', items: [], placeOfSupply: '', bankDetails: userProfile.bankAccounts[0] } as Invoice
        });
      }
    }

    if (conflicting.length > 0) {
      setUploadConflicts({ conflicting, strictlyNew, updatedClients, totalFiles: files.length, clientsChanged });
      setIsUploadingBill(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return; 
    } else {
      finalizeUpload(strictlyNew, updatedClients, files.length, clientsChanged);
    }
  };`;


const startIndex = code.indexOf('  const handleUploadBill = async (e: React.ChangeEvent<HTMLInputElement>) => {');
// The finalizeUpload function starts right after handleUploadBill
let endIndex = code.indexOf('  const finalizeUpload = (invoicesToApply: Invoice[]');
if(endIndex === -1) {
   endIndex = code.indexOf('const finalizeUpload = (invoicesToApply');
}

if (startIndex > -1 && endIndex > -1) {
  const newCode = code.substring(0, startIndex) + strictOldhandleUploadBill + '\n\n' + code.substring(endIndex);
  fs.writeFileSync('App.tsx', newCode);
  console.log("Successfully restored handleUploadBill body.");
} else {
  console.log("Could not find start or end index");
}
