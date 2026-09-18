const fs = require('fs');
let content = fs.readFileSync('components/DocumentSigner.tsx', 'utf-8');

const anchor = `const sigBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');`;
const replacement = `
        const rawData = sigCanvas.current.toData();
        // Convert to highly compressed vector format
        const vectorData = rawData.map((line: any) => {
            return line.points
                .filter((_: any, i: number) => i % 2 === 0 || i === line.points.length - 1) // Downsample points by half
                .map((p: any) => [Math.round(p.x), Math.round(p.y)]);
        });
        const payload = JSON.stringify({
            v: 1, // version
            w: sigCanvas.current.getCanvas().width,
            h: sigCanvas.current.getCanvas().height,
            l: vectorData // lines
        });
        const compressedSig = LZString.compressToEncodedURIComponent(payload);
`;

content = content.replace(anchor + `
        
        // compress signature to fit in URL
        const compressedSig = LZString.compressToEncodedURIComponent(sigBase64);`, replacement);
fs.writeFileSync('components/DocumentSigner.tsx', content);
