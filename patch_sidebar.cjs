const fs = require('fs');
let content = fs.readFileSync('components/Sidebar.tsx', 'utf-8');

if (!content.includes("{ id: 'notes'")) {
  const settingsLine = "    { id: 'settings', label: 'Settings'";
  const notesLine = "    { id: 'notes', label: 'Notes', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },\n";
  content = content.replace(settingsLine, notesLine + settingsLine);
  fs.writeFileSync('components/Sidebar.tsx', content);
  console.log('Added Notes to Sidebar');
} else {
  console.log('Notes already in Sidebar');
}
