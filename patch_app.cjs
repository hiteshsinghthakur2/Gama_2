const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

// Add Note to types import
content = content.replace(/import \{([^}]+)\} from '\.\/types';/, function(match, p1) {
  if (!p1.includes('Note')) {
    return 'import {' + p1 + ', Note} from "./types";';
  }
  return match;
});

// Add Notes component import
if (!content.includes('import Notes from')) {
  content = content.replace(/import Settings from '\.\/components\/Settings';/, "import Settings from './components/Settings';\nimport Notes from './components/Notes';");
}

// Add state for notes
if (!content.includes('const [notes, setNotes] = useState<Note[]>(')) {
  content = content.replace(/const \[clients, setClients\] = useState<Client\[\]>\(\[\]\);/, "const [clients, setClients] = useState<Client[]>([]);\n  const [notes, setNotes] = useState<Note[]>([]);");
}

// Ensure the local storage load logic is updated
const loadStateCode = "        if (savedData.userProfile) setUserProfile(savedData.userProfile);";
const loadStateReplacement = "        if (savedData.userProfile) setUserProfile(savedData.userProfile);\n        if (savedData.notes) setNotes(savedData.notes);";
if (!content.includes('if (savedData.notes) setNotes')) {
  content = content.replace(loadStateCode, loadStateReplacement);
}

// Ensure local storage save logic is updated
const saveStateCode = "      await LocalStorageService.saveData({ invoices, quotations, deliveryChallans, clients, purchases, leads, userProfile });";
const saveStateReplacement = "      await LocalStorageService.saveData({ invoices, quotations, deliveryChallans, clients, purchases, leads, userProfile, notes });";
if (!content.includes('notes }')) {
  content = content.replace(saveStateCode, saveStateReplacement);
}

// Add Notes tab case in renderContent
const notesCase = "      case 'notes':\n        return <Notes notes={notes} setNotes={setNotes} />;";
if (!content.includes("case 'notes':")) {
  content = content.replace(/      case 'settings':/, notesCase + "\n      case 'settings':");
}

fs.writeFileSync('App.tsx', content);
console.log('Patched App.tsx');
