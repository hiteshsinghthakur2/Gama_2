const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

const anchor = `const sig = LZString.decompressFromEncodedURIComponent(sigCompressed);
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
                }`;

const replacement = `const sigRaw = LZString.decompressFromEncodedURIComponent(sigCompressed);
                if (sigRaw) {
                    let finalSig = sigRaw;
                    
                    // Handle vector data payload
                    if (sigRaw.startsWith('{')) {
                        try {
                            const parsed = JSON.parse(sigRaw);
                            if (parsed.v === 1 && parsed.l) {
                                const tempCanvas = document.createElement('canvas');
                                tempCanvas.width = parsed.w || 400;
                                tempCanvas.height = parsed.h || 200;
                                const ctx = tempCanvas.getContext('2d');
                                if (ctx) {
                                    ctx.strokeStyle = 'black';
                                    ctx.lineWidth = 3;
                                    ctx.lineCap = 'round';
                                    ctx.lineJoin = 'round';
                                    parsed.l.forEach((line: any[]) => {
                                        ctx.beginPath();
                                        line.forEach((pt: number[], i: number) => {
                                            if (i === 0) ctx.moveTo(pt[0], pt[1]);
                                            else ctx.lineTo(pt[0], pt[1]);
                                        });
                                        ctx.stroke();
                                    });
                                    
                                    // Trim canvas manually
                                    let minX = tempCanvas.width, minY = tempCanvas.height, maxX = 0, maxY = 0;
                                    parsed.l.forEach((line: any[]) => {
                                        line.forEach((pt: number[]) => {
                                            if (pt[0] < minX) minX = pt[0];
                                            if (pt[1] < minY) minY = pt[1];
                                            if (pt[0] > maxX) maxX = pt[0];
                                            if (pt[1] > maxY) maxY = pt[1];
                                        });
                                    });
                                    const pad = 10;
                                    minX = Math.max(0, minX - pad);
                                    minY = Math.max(0, minY - pad);
                                    maxX = Math.min(tempCanvas.width, maxX + pad);
                                    maxY = Math.min(tempCanvas.height, maxY + pad);
                                    const trimWidth = Math.max(1, maxX - minX);
                                    const trimHeight = Math.max(1, maxY - minY);
                                    
                                    const trimCanvas = document.createElement('canvas');
                                    trimCanvas.width = trimWidth;
                                    trimCanvas.height = trimHeight;
                                    const trimCtx = trimCanvas.getContext('2d');
                                    if (trimCtx) {
                                        trimCtx.drawImage(tempCanvas, minX, minY, trimWidth, trimHeight, 0, 0, trimWidth, trimHeight);
                                        finalSig = trimCanvas.toDataURL('image/png');
                                    }
                                }
                            }
                        } catch (e) {
                            console.error("Vector decode error", e);
                        }
                    }

                    let updated = false;
                    const updatedChallans = deliveryChallans.map(dc => {
                        if (dc.id === docId && dc.signatureUrl !== finalSig) {
                            updated = true;
                            return { ...dc, signatureUrl: finalSig };
                        }
                        return dc;
                    });
                    
                    if (updated) {
                      setDeliveryChallans(updatedChallans);
                      // Clear the URL without refreshing
                      window.history.replaceState({}, document.title, window.location.pathname);
                      alert("Signature successfully received and attached to the Delivery Challan!");
                    }
                }`;

if (content.includes(anchor)) {
    content = content.replace(anchor, replacement);
    fs.writeFileSync('App.tsx', content);
    console.log("App.tsx patched!");
} else {
    console.log("App.tsx anchor not found!");
}
