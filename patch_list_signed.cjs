const fs = require('fs');
let content = fs.readFileSync('components/DeliveryChallanList.tsx', 'utf-8');

const anchor = `<td className="px-6 py-4 text-gray-500 text-xs font-bold uppercase">{new Date(challan.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}</td>`;
const replacement = `<td className="px-6 py-4 text-gray-500 text-xs font-bold uppercase">
                      <div className="flex items-center gap-2">
                        {new Date(challan.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}
                        {challan.signatureUrl && (
                          <span className="bg-emerald-100 text-emerald-700 p-1 rounded-full" title="Signed">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </span>
                        )}
                      </div>
                    </td>`;

content = content.replace(anchor, replacement);
fs.writeFileSync('components/DeliveryChallanList.tsx', content);
