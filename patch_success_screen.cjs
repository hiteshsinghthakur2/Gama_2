const fs = require('fs');
let content = fs.readFileSync('components/DocumentSigner.tsx', 'utf-8');

const anchor = `Your signature has been generated. If the return message didn't open automatically, please paste the link you just copied and send it back to the issuer.
                    </p>
                    <button 
                        onClick={() => window.close()}`;

const replacement = `Your signature has been generated. If your messaging app didn't open automatically, please paste the link you just copied and send it back to the sender.
                    </p>
                    
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 text-sm text-blue-800 text-left">
                        <strong>Testing this yourself?</strong><br/>
                        If you are the admin testing this feature, you must open the return link to actually save the signature to your database.
                    </div>

                    <a 
                        href={returnUrl}
                        className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition mb-3"
                    >
                        Apply Signature Now
                    </a>

                    <button 
                        onClick={() => window.close()}`;

content = content.replace(anchor, replacement);
fs.writeFileSync('components/DocumentSigner.tsx', content);
