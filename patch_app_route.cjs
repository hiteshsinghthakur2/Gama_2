const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

// Add import
const importLZ = `import LZString from 'lz-string';
import { DocumentSigner } from './components/DocumentSigner';`;
content = content.replace("import { INITIAL_USER_PROFILE, INDIAN_STATES } from './constants';", importLZ + "\nimport { INITIAL_USER_PROFILE, INDIAN_STATES } from './constants';");

// Check URL search params inside App component
const initRoute = `  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'quotations' | 'delivery_challans' | 'leads' | 'clients' | 'settings' | 'purchases' | 'trash'>('dashboard');`;

const routeCheck = `  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'quotations' | 'delivery_challans' | 'leads' | 'clients' | 'settings' | 'purchases' | 'trash'>('dashboard');
  const [isSignRoute, setIsSignRoute] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('sign_challan')) {
        setIsSignRoute(true);
    }
    
    if (urlParams.has('receive_signature')) {
        const docId = urlParams.get('id');
        const sigCompressed = urlParams.get('sig');
        if (docId && sigCompressed && deliveryChallans.length > 0) {
            try {
                const sig = LZString.decompressFromEncodedURIComponent(sigCompressed);
                if (sig) {
                    const updatedChallans = deliveryChallans.map(dc => {
                        if (dc.id === docId) {
                            return { ...dc, signatureUrl: sig };
                        }
                        return dc;
                    });
                    setDeliveryChallans(updatedChallans);
                    // Clear the URL without refreshing
                    window.history.replaceState({}, document.title, window.location.pathname);
                    alert("Signature successfully received and attached to the Delivery Challan!");
                }
            } catch (e) {
                console.error("Error saving signature", e);
            }
        }
    }
  }, [deliveryChallans]); // We need deliveryChallans to be loaded
`;

content = content.replace(initRoute, routeCheck);

const renderTop = `  if (isSignRoute) {
    return <DocumentSigner />;
  }`;
content = content.replace(`  return (\n    <div className="flex h-screen`, renderTop + `\n  return (\n    <div className="flex h-screen`);

fs.writeFileSync('App.tsx', content);
