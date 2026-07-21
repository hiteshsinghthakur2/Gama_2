const fs = require('fs');
let file = fs.readFileSync('services/GoogleDriveService.ts', 'utf-8');

const uploadFileFunc = `
export const uploadFileToDrive = async (file: File, folderName: string = 'CraftDaddy Uploads') => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Drive. Please connect your account in Settings or try syncing again.');

  let folderId = null;
  const searchRes = await fetch(\`https://www.googleapis.com/drive/v3/files?q=name='\${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false\`, {
    headers: { Authorization: \`Bearer \${token}\` }
  });
  const searchData = await searchRes.json();
  
  if (searchData.files && searchData.files.length > 0) {
    folderId = searchData.files[0].id;
  } else {
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { 
         Authorization: \`Bearer \${token}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });
    const createData = await createRes.json();
    folderId = createData.id;
  }

  const metadata = {
    name: file.name,
    parents: [folderId]
  };
  
  const createResMetadata = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${token}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!createResMetadata.ok) {
    throw new Error('Failed to create file metadata in Google Drive');
  }
  
  const createdFile = await createResMetadata.json();

  const uploadRes = await fetch(\`https://www.googleapis.com/upload/drive/v3/files/\${createdFile.id}?uploadType=media\`, {
    method: 'PATCH',
    headers: {
      Authorization: \`Bearer \${token}\`,
      'Content-Type': file.type
    },
    body: file
  });

  if (!uploadRes.ok) {
    throw new Error('Failed to upload file content to Google Drive');
  }
  
  return await uploadRes.json();
};
`;

if (!file.includes('uploadFileToDrive')) {
  file += uploadFileFunc;
  fs.writeFileSync('services/GoogleDriveService.ts', file);
}
