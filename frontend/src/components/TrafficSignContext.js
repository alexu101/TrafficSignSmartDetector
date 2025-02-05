import { createContext, useState, useRef } from 'react';

export const TrafficSignContext = createContext();

export const TrafficSignProvider = ({ children }) => {
  const canvasRef = useRef(null);
  const [detections, setDetections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [croppedCanvas, setCroppedCanvas] = useState(null);

  return (
    <TrafficSignContext.Provider value={{ canvasRef, detections, setDetections, loading, setLoading, croppedCanvas, setCroppedCanvas  }}>
      {children}
    </TrafficSignContext.Provider>
  );
};