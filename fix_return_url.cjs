const fs = require('fs');
let content = fs.readFileSync('components/DocumentSigner.tsx', 'utf-8');

const anchor = `const [isSuccess, setIsSuccess] = useState<boolean>(false);`;
const replacement = `const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [savedReturnUrl, setSavedReturnUrl] = useState<string>('');`;

content = content.replace(anchor, replacement);

const returnUrlAnchor = `const returnUrl = \`\${window.location.origin}/?receive_signature=1&id=\${data.id}&sig=\${compressedSig}\`;`;
const returnUrlReplacement = `const returnUrl = \`\${window.location.origin}/?receive_signature=1&id=\${data.id}&sig=\${compressedSig}\`;
        setSavedReturnUrl(returnUrl);`;

content = content.replace(returnUrlAnchor, returnUrlReplacement);

const htmlAnchor = `href={returnUrl}`;
const htmlReplacement = `href={savedReturnUrl}`;

content = content.replace(htmlAnchor, htmlReplacement);

fs.writeFileSync('components/DocumentSigner.tsx', content);
