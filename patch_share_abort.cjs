const fs = require('fs');
let content = fs.readFileSync('components/DocumentSigner.tsx', 'utf-8');

const navShareReplacement = `        if (navigator.share && navigator.canShare && navigator.canShare({ url: returnUrl })) {
            navigator.share({
                title: 'Signed Delivery Challan',
                text: \`I have signed the Delivery Challan \${data.number}. Click the link to save it:\`,
                url: returnUrl
            }).then(() => {
                setIsSuccess(true);
            }).catch((e) => {
                console.error(e);
                if (e.name !== 'AbortError') {
                    fallback();
                }
            });
        } else {
            fallback();
        }`;

// We need to replace the entire block
const blockToReplace = `        // Native share if supported, otherwise fallback to WhatsApp
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
            });
        } else {
            fallback();
        }`;

content = content.replace(blockToReplace, navShareReplacement);
fs.writeFileSync('components/DocumentSigner.tsx', content);
