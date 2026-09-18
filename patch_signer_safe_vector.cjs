const fs = require('fs');
let content = fs.readFileSync('components/DocumentSigner.tsx', 'utf-8');

const oldVector = `        const vectorData = rawData.map((line: any) => {
            return line.points
                .filter((_: any, i: number) => i % 2 === 0 || i === line.points.length - 1) // Downsample points by half
                .map((p: any) => [Math.round(p.x), Math.round(p.y)]);
        });`;

const newVector = `        const vectorData = rawData.map((line: any) => {
            if (!line || !line.points) return [];
            return line.points
                .filter((_: any, i: number) => i % 2 === 0 || i === line.points.length - 1) // Downsample points by half
                .map((p: any) => [Math.round(p.x), Math.round(p.y)]);
        }).filter((l: any[]) => l.length > 0);`;

content = content.replace(oldVector, newVector);
fs.writeFileSync('components/DocumentSigner.tsx', content);
