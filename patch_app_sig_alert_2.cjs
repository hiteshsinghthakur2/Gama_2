const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

const anchor = `if (updated) {
                      setDeliveryChallans(updatedChallans);
                      // Clear the URL without refreshing
                      window.history.replaceState({}, document.title, window.location.pathname);
                      alert("Signature successfully received and attached to the Delivery Challan!");
                    }`;

const replacement = `if (updated) {
                      setDeliveryChallans(updatedChallans);
                      // Clear the URL without refreshing
                      window.history.replaceState({}, document.title, window.location.pathname);
                      alert("Signature successfully received and attached to the Delivery Challan!");
                    } else {
                      const dcExists = deliveryChallans.find(dc => dc.id === docId);
                      if (!dcExists) {
                          alert("Delivery Challan not found. Signature could not be attached.");
                      } else {
                          // Check if it's already signed with this exact signature
                          if (dcExists.signatureUrl === finalSig) {
                              alert("This signature has already been attached to the Delivery Challan.");
                          } else {
                              alert("Failed to attach the signature due to an unknown mismatch.");
                          }
                      }
                      window.history.replaceState({}, document.title, window.location.pathname);
                    }`;

content = content.replace(anchor, replacement);
fs.writeFileSync('App.tsx', content);
