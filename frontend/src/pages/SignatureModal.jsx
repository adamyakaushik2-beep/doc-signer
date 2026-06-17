import { useRef, useState } from 'react';

const SignatureModal = ({ isOpen, onClose, onSave }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  if (!isOpen) return null;

  // Start drawing coordinates
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  // Draw line as mouse moves
  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Clear the canvas coordinates
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Convert canvas stroke to base64 image data string
  const handleSave = () => {
    const canvas = canvasRef.current;
    const signatureImage = canvas.toDataURL('image/png'); // Converts drawing to a string
    onSave(signatureImage);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-lg w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Draw Your Digital Signature</h3>
        <p className="text-xs text-gray-500 mb-4">Use your mouse or touchpad to sign inside the box below.</p>

        {/* The Drawing Pad Box */}
        <canvas
          ref={canvasRef}
          width={450}
          height={200}
          className="border border-gray-300 rounded-lg bg-gray-50 cursor-crosshair block mx-auto"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />

        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={clearCanvas}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            Clear Pad
          </button>
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 border border-gray-300 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shadow"
            >
              Confirm & Sign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;