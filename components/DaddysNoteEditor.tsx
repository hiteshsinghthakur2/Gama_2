import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Line, Text as KonvaText } from 'react-konva';

export interface Annotation {
  id: string;
  type: 'rect' | 'pen' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  text?: string;
  color: string;
}

interface Props {
  documentUrl: string;
  annotations: Annotation[];
  onChange: (annotations: Annotation[]) => void;
  readOnly?: boolean;
}

const DaddysNoteEditor: React.FC<Props> = ({ documentUrl, annotations, onChange, readOnly = false }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<'pen' | 'rect' | 'text' | 'select'>('select');
  const [color, setColor] = useState<string>('#ef4444');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [stageWidth, setStageWidth] = useState(800);
  const [stageHeight, setStageHeight] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!documentUrl) return;
    const img = new window.Image();
    img.src = documentUrl;
    img.onload = () => {
      setImage(img);
      if (containerRef.current) {
        const cw = containerRef.current.clientWidth;
        setStageWidth(cw);
        setStageHeight(img.height * (cw / img.width));
      }
    };
  }, [documentUrl]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && image) {
        const cw = containerRef.current.clientWidth;
        setStageWidth(cw);
        setStageHeight(image.height * (cw / image.width));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [image]);

  const handleMouseDown = (e: any) => {
    if (readOnly || tool === 'select') return;
    const pos = e.target.getStage().getPointerPosition();
    const id = Date.now().toString();
    setIsDrawing(true);
    setCurrentId(id);

    const scale = stageWidth / (image?.width || 1);
    const x = pos.x / scale;
    const y = pos.y / scale;

    const newAnnotation: Annotation = {
      id,
      type: tool,
      x,
      y,
      color,
      points: tool === 'pen' ? [x, y] : undefined,
      width: tool === 'rect' ? 0 : undefined,
      height: tool === 'rect' ? 0 : undefined,
      text: tool === 'text' ? 'Double click to edit' : undefined
    };

    onChange([...annotations, newAnnotation]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || readOnly || tool === 'select' || tool === 'text' || !currentId) return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const scale = stageWidth / (image?.width || 1);
    const x = point.x / scale;
    const y = point.y / scale;

    onChange(
      annotations.map((ann) => {
        if (ann.id === currentId) {
          if (tool === 'pen') {
            return { ...ann, points: [...(ann.points || []), x, y] };
          }
          if (tool === 'rect') {
            return { ...ann, width: x - ann.x, height: y - ann.y };
          }
        }
        return ann;
      })
    );
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setCurrentId(null);
  };

  const scale = image ? stageWidth / image.width : 1;

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg overflow-hidden">
      {!readOnly && (
        <div className="flex flex-wrap gap-2 p-3 bg-white border-b border-gray-200 items-center">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['select', 'pen', 'rect', 'text'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTool(t)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition ${tool === t ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          <div className="flex gap-1">
            {['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#000000'].map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition ${color === c ? 'border-indigo-500 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          <button 
            onClick={() => onChange([])} 
            className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-md transition"
          >
            Clear All
          </button>
        </div>
      )}
      
      <div className="flex-1 overflow-auto custom-scrollbar p-4 flex justify-center bg-gray-100" ref={containerRef}>
        {!image ? (
          <div className="text-gray-400 flex items-center justify-center h-full text-sm">
            Please upload a document image to start annotating.
          </div>
        ) : (
          <div className="shadow-lg bg-white">
            <Stage
              width={stageWidth}
              height={stageHeight}
              onMouseDown={handleMouseDown}
              onMousemove={handleMouseMove}
              onMouseup={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            >
              <Layer scaleX={scale} scaleY={scale}>
                <KonvaImage image={image} />
                {annotations.map((ann, i) => {
                  if (ann.type === 'pen') {
                    return (
                      <Line
                        key={i}
                        points={ann.points}
                        stroke={ann.color}
                        strokeWidth={3}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                      />
                    );
                  }
                  if (ann.type === 'rect') {
                    return (
                      <Rect
                        key={i}
                        x={ann.x}
                        y={ann.y}
                        width={ann.width || 0}
                        height={ann.height || 0}
                        stroke={ann.color}
                        strokeWidth={3}
                      />
                    );
                  }
                  if (ann.type === 'text') {
                    return (
                      <KonvaText
                        key={i}
                        x={ann.x}
                        y={ann.y}
                        text={ann.text}
                        fontSize={20}
                        fill={ann.color}
                        fontFamily="sans-serif"
                        fontStyle="bold"
                        draggable={!readOnly && tool === 'select'}
                        onDragEnd={(e) => {
                          if (readOnly) return;
                          const newAnns = [...annotations];
                          newAnns[i].x = e.target.x();
                          newAnns[i].y = e.target.y();
                          onChange(newAnns);
                        }}
                        onDblClick={(e) => {
                          if (readOnly) return;
                          const text = window.prompt('Enter text:', ann.text);
                          if (text !== null) {
                            const newAnns = [...annotations];
                            newAnns[i].text = text;
                            onChange(newAnns);
                          }
                        }}
                        onDblTap={(e) => {
                          if (readOnly) return;
                          const text = window.prompt('Enter text:', ann.text);
                          if (text !== null) {
                            const newAnns = [...annotations];
                            newAnns[i].text = text;
                            onChange(newAnns);
                          }
                        }}
                      />
                    );
                  }
                  return null;
                })}
              </Layer>
            </Stage>
          </div>
        )}
      </div>
    </div>
  );
};

export default DaddysNoteEditor;
