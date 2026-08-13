const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

// Add import
if (!content.includes('import SharedDaddysNote from')) {
  content = content.replace(/import Notes from '\.\/components\/Notes';/, "import Notes from './components/Notes';\nimport SharedDaddysNote from './components/SharedDaddysNote';");
}

// Check if ?sharedNote is in URL before rendering App
const checkSharedURLCode = `
  const urlParams = new URLSearchParams(window.location.search);
  const sharedNoteId = urlParams.get('sharedNote');
  
  if (sharedNoteId) {
    return <SharedDaddysNote noteId={sharedNoteId} />;
  }

  return (`;

if (!content.includes('sharedNoteId = urlParams.get')) {
  content = content.replace(/  return \(\n    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-800">/, checkSharedURLCode + "\n    <div className=\"flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-800\">");
}

fs.writeFileSync('App.tsx', content);
console.log('Patched App.tsx for shared URL');
