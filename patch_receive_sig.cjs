const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

const anchor1 = `    if (urlParams.has('receive_signature')) {
        const docId = urlParams.get('id');
        const sigCompressed = urlParams.get('sig');
        if (docId && sigCompressed && deliveryChallans && deliveryChallans.length > 0) {`;

const rep1 = `    if (urlParams.has('receive_signature')) {
        const docId = urlParams.get('id');
        const sigCompressed = urlParams.get('sig');
        // Remove length requirement on deliveryChallans so we process even if it's the only challan!
        if (docId && sigCompressed && deliveryChallans) {
            const dcExists = deliveryChallans.find(dc => dc.id === docId);
            if (!dcExists) {
                // Not found. This could mean it hasn't loaded yet. Wait for next render.
                return;
            }`;

content = content.replace(anchor1, rep1);

fs.writeFileSync('App.tsx', content);
