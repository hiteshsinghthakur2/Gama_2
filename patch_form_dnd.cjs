const fs = require('fs');
let content = fs.readFileSync('components/InvoiceForm.tsx', 'utf-8');

const stateStr = `  const [document, setDocument] = useState<any>(() => {`;
const newStates = `
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItemIndex(index);
    // Needed for Firefox
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (index !== dragOverItemIndex) {
        setDragOverItemIndex(index);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDragEnd = () => {
    if (draggedItemIndex !== null && dragOverItemIndex !== null && draggedItemIndex !== dragOverItemIndex) {
      setDocument((prev: any) => {
          const newItems = [...prev.items];
          const draggedItem = newItems[draggedItemIndex];
          newItems.splice(draggedItemIndex, 1);
          newItems.splice(dragOverItemIndex, 0, draggedItem);
          return { ...prev, items: newItems };
      });
    }
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  const [document, setDocument] = useState<any>(() => {`;

content = content.replace(stateStr, newStates);

// Desktop item list
const rowStr1 = `<div key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition group">`;
const newRowStr1 = `
<div 
  key={item.id} 
  className={\`border-b border-gray-100 transition group bg-white \${draggedItemIndex === idx ? 'opacity-50 border-indigo-500 border-2' : ''} \${dragOverItemIndex === idx && draggedItemIndex !== idx ? 'border-t-2 border-t-indigo-500' : ''}\`}
  draggable
  onDragStart={(e) => handleDragStart(e, idx)}
  onDragEnter={(e) => handleDragEnter(e, idx)}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
  style={{ cursor: 'grab' }}
>
`;
content = content.replace(rowStr1, newRowStr1);

// Mobile item list
const rowStr2 = `<div key={item.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">`;
const newRowStr2 = `
<div 
  key={item.id} 
  className={\`bg-white border rounded-xl shadow-sm overflow-hidden \${draggedItemIndex === idx ? 'opacity-50 border-indigo-500 border-2' : 'border-gray-200'} \${dragOverItemIndex === idx && draggedItemIndex !== idx ? 'border-t-2 border-t-indigo-500' : ''}\`}
  draggable
  onDragStart={(e) => handleDragStart(e, idx)}
  onDragEnter={(e) => handleDragEnter(e, idx)}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
  style={{ cursor: 'grab' }}
>
`;
content = content.replace(rowStr2, newRowStr2);

fs.writeFileSync('components/InvoiceForm.tsx', content);
console.log('Patched drag and drop logic.');
