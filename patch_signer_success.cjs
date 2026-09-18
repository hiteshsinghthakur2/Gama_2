const fs = require('fs');
let content = fs.readFileSync('components/DocumentSigner.tsx', 'utf-8');

const isSuccessAnchor = `const [error, setError] = useState<string>('');`;
const isSuccessVar = `\n    const [isSuccess, setIsSuccess] = useState<boolean>(false);`;

content = content.replace(isSuccessAnchor, isSuccessAnchor + isSuccessVar);

const fallbackAnchor = `const fallback = () => {
            const waUrl = \`https://wa.me/?text=\${encodeURIComponent(\`I have signed the Delivery Challan \${data.number}. Click the link to save it:\\n\\n\${returnUrl}\`)}\`;
            window.open(waUrl, '_blank');
            // Also copy to clipboard just in case popup is blocked
            navigator.clipboard.writeText(returnUrl).then(() => {
                alert("If WhatsApp didn't open, the link has been copied to your clipboard!");
            }).catch(() => {});
        };`;

const fallbackReplacement = `const fallback = () => {
            const waUrl = \`https://wa.me/?text=\${encodeURIComponent(\`I have signed the Delivery Challan \${data.number}. Click the link to save it:\\n\\n\${returnUrl}\`)}\`;
            window.open(waUrl, '_blank');
            // Also copy to clipboard just in case popup is blocked
            navigator.clipboard.writeText(returnUrl).then(() => {
                setIsSuccess(true);
            }).catch(() => {
                setIsSuccess(true);
            });
        };`;

content = content.replace(fallbackAnchor, fallbackReplacement);

const navShareAnchor = `        // Native share if supported, otherwise fallback to WhatsApp
        if (navigator.share) {
            navigator.share({
                title: 'Signed Delivery Challan',
                text: \`I have signed the Delivery Challan \${data.number}. Click the link to save it:\`,
                url: returnUrl
            }).catch((e) => {
                console.error(e);
                fallback();
            });`;

const navShareReplacement = `        // Native share if supported, otherwise fallback to WhatsApp
        if (navigator.share) {
            navigator.share({
                title: 'Signed Delivery Challan',
                text: \`I have signed the Delivery Challan \${data.number}. Click the link to save it:\`,
                url: returnUrl
            }).then(() => {
                setIsSuccess(true);
            }).catch((e) => {
                console.error(e);
                fallback();
            });`;

content = content.replace(navShareAnchor, navShareReplacement);


const successUI = `
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">Document Signed!</h2>
                    <p className="text-gray-600 mb-8">
                        Your signature has been generated. If the return message didn't open automatically, please paste the link you just copied and send it back to the issuer.
                    </p>
                    <button 
                        onClick={() => window.close()}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        );
    }
`;

const ifErrorAnchor = `if (error) {`;
content = content.replace(ifErrorAnchor, successUI + '\n    ' + ifErrorAnchor);

fs.writeFileSync('components/DocumentSigner.tsx', content);
