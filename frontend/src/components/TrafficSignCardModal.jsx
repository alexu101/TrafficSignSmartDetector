import React, { useEffect, useRef } from 'react';

function TrafficSignCardModal({ sign, croppedCanvas, onClose }) {
  const modalCanvasRef = useRef(null);

  useEffect(() => {
    if (!sign || !croppedCanvas || !modalCanvasRef.current) return;

    const xMin = sign.bbox.x_min;
    const yMin = sign.bbox.y_min;
    const xMax = sign.bbox.x_max;
    const yMax = sign.bbox.y_max;
    const width = xMax - xMin;
    const height = yMax - yMin;

    const sourceCanvas = croppedCanvas.current;
    const sourceCtx = sourceCanvas.getContext('2d');

    const modalCanvas = modalCanvasRef.current;
    const modalCtx = modalCanvas.getContext('2d');

    // Set the canvas size
    modalCanvas.width = width;
    modalCanvas.height = height;

    // Clear and draw the cropped area from source canvas
    modalCtx.clearRect(0, 0, width, height);
    modalCtx.drawImage(sourceCanvas, xMin, yMin, width, height, 0, 0, width, height);
  }, [sign, croppedCanvas]);

  if (!sign) return null;

  return (
    <div className='modalOverlay' onClick={onClose}>
      <div className='modalContent' onClick={(e) => e.stopPropagation()}>
        <h2 className='title'>{sign.class.trafficSign}</h2>
        <canvas ref={modalCanvasRef} style={{ width: '300px', borderRadius: '10px' }}></canvas>
        <div className='trafficSignOntologyDetails'>
          {Object.keys(sign.ontologyDetails)?.map((key, index) => (
            <div key={index} className='ontologyItem'>
              <span className='left'><strong>{String(key).charAt(0).toUpperCase() + String(key).slice(1)}:</strong></span> <span className='right'>{sign.ontologyDetails[key]}</span> 
            </div>
          ))}
        </div>
        <button className='mediaPlayerButton' onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default TrafficSignCardModal;
