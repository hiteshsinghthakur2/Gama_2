const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

// Add NOTES to STORAGE_KEYS
if (!content.includes('NOTES: \'bos_cloud_notes\'')) {
  content = content.replace(/PROFILE: 'bos_cloud_user_profile',/, "PROFILE: 'bos_cloud_user_profile',\n  NOTES: 'bos_cloud_notes',");
}

// Add load logic for notes
const loadLogic = `        const loadedNotes = await StorageService.load(STORAGE_KEYS.NOTES, []);`;
const setLogic = `        setNotes(loadedNotes);`;

if (!content.includes('StorageService.load(STORAGE_KEYS.NOTES')) {
  content = content.replace(/const loadedProfile = await StorageService\.load\(STORAGE_KEYS\.PROFILE, INITIAL_USER_PROFILE\);/, "const loadedProfile = await StorageService.load(STORAGE_KEYS.PROFILE, INITIAL_USER_PROFILE);\n        const loadedNotes = await StorageService.load(STORAGE_KEYS.NOTES, []);");
}

if (!content.includes('setNotes(loadedNotes)')) {
  content = content.replace(/setUserProfile\(loadedProfile\);/, "setUserProfile(loadedProfile);\n        setNotes(loadedNotes);");
}

// Add save logic for notes
if (!content.includes('StorageService.save(STORAGE_KEYS.NOTES, notes)')) {
  content = content.replace(/useEffect\(\(\) => \{ if \(\!isLoading\) StorageService\.save\(STORAGE_KEYS\.PROFILE, userProfile\); \}, \[userProfile, isLoading\]\);/, "useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.PROFILE, userProfile); }, [userProfile, isLoading]);\n  useEffect(() => { if (!isLoading) StorageService.save(STORAGE_KEYS.NOTES, notes); }, [notes, isLoading]);");
}

fs.writeFileSync('App.tsx', content);
console.log('Patched storage logic in App.tsx');
