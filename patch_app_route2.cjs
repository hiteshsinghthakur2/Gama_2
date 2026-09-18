const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

const anchor = `const App: React.FC = () => {`;

const newCode = `const App: React.FC = () => {
  const [isSignRoute, setIsSignRoute] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('sign_challan')) {
        setIsSignRoute(true);
    }
    
    if (urlParams.has('receive_signature')) {
        const docId = urlParams.get('id');
        const sigCompressed = urlParams.get('sig');
        // We defer applying the signature until deliveryChallans are loaded.
        // It's handled by another effect below
    }
  }, []);

  // Handle signature reception when challans load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('receive_signature')) {
        const docId = urlParams.get('id');
        const sigCompressed = urlParams.get('sig');
        if (docId && sigCompressed && deliveryChallans && deliveryChallans.length > 0) {
            try {
                const sig = LZString.decompressFromEncodedURIComponent(sigCompressed);
                if (sig) {
                    let updated = false;
                    const updatedChallans = deliveryChallans.map(dc => {
                        if (dc.id === docId && dc.signatureUrl !== sig) {
                            updated = true;
                            return { ...dc, signatureUrl: sig };
                        }
                        return dc;
                    });
                    
                    if (updated) {
                      setDeliveryChallans(updatedChallans);
                      // Clear the URL without refreshing
                      window.history.replaceState({}, document.title, window.location.pathname);
                      alert("Signature successfully received and attached to the Delivery Challan!");
                    }
                }
            } catch (e) {
                console.error("Error saving signature", e);
            }
        }
    }
  }, [deliveryChallans]);
`;

content = content.replace(anchor, newCode);
fs.writeFileSync('App.tsx', content);
