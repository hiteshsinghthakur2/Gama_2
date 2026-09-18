const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

const anchor = `const sigRaw = LZString.decompressFromEncodedURIComponent(sigCompressed);
                if (sigRaw) {`;

const replacement = `const sigRaw = LZString.decompressFromEncodedURIComponent(sigCompressed);
                if (!sigRaw) {
                    alert("The signature link appears to be invalid or was cut off by the messaging app. Please ask the sender to try again.");
                } else {`;

content = content.replace(anchor, replacement);

const errorAnchor = `} catch (e) {
                console.error("Error saving signature", e);
            }`;

const errorReplacement = `} catch (e) {
                console.error("Error saving signature", e);
                alert("Failed to read the signature data. The link may be broken.");
            }`;

content = content.replace(errorAnchor, errorReplacement);

fs.writeFileSync('App.tsx', content);
