import React, { useEffect, useRef, useState, useContext } from 'react';
import '../assets/styles/LoadInput.css';
import { TrafficSignContext } from './TrafficSignContext';

function LoadInput() {
  const [file, setFile] = useState(null);
  const [totalFrames, setTotalFrames] = useState(0);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const canvasRef = useRef(null);
  const [frameUrls, setFrameUrls] = useState([]);
  const [videoId, setVideoId] = useState();
  const [extractedImage, setExtractedImage] = useState(null);
  const [selectedSign, setSelectedSign] = useState(null);

  const { setDetections, detections, loading, setLoading, canvasRefs, croppedCanvas, setCroppedCanvas  } = useContext(TrafficSignContext);

  const handleFileChange = async (event) => {
    if (event.target.files) {
      const selectedFile = event.target.files[0];
      if (!selectedFile.type.startsWith('video/')) {
        alert('Please upload a valid video file!');
        return;
      }

      setFile(selectedFile);
      await uploadVideo(selectedFile);
    }
  };

  const uploadVideo = async (videoFile) => {
    const formData = new FormData();
    formData.append('video', videoFile);

    try {
      const response = await fetch('https://backend-service-251997476317.us-central1.run.app/api/video/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        if (data.video) {
          setTotalFrames(data.video.frameCount);
          setFrameUrls(data.video.frames.map((frame) => frame.framePath));
          setVideoId(data.video.videoId);
        }
      } else {
        console.error('❌ Error uploading video!');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
    }
  };

  const handleNavigation = (direction) => {
    setCurrentFrameIndex((prevIndex) => {
      let newIndex = prevIndex;
      if (direction === 'previous' && prevIndex > 0) {
        newIndex = prevIndex - 1;
      } else if (direction === 'next' && prevIndex < totalFrames - 1) {
        newIndex = prevIndex + 1;
      }
      return newIndex;
    });
  };

  const detectionsCache = {};
  const loadFrameToCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || frameUrls.length === 0) return;

    const context = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `${frameUrls[currentFrameIndex]}?authuser=0`;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      setDetections([]);
      autoDetect();
    };
  };
  
  const autoDetect = async () => {
    
    if (frameUrls.length === 0) return;
    const frameUrl = frameUrls[currentFrameIndex];

    try {
      setLoading(true);
      const response = await fetch('https://backend-service-251997476317.us-central1.run.app/api/yolo/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: frameUrl, videoId: videoId }),
      });

      if (response.ok) {
        const data = await response.json();
        const filteredDetections = data.video.frames[currentFrameIndex].detections.filter(detection => detection.confidence > 0.7);
        setDetections(filteredDetections);
        setLoading(false);
        setCroppedCanvas(canvasRef);

        drawBoundingBoxes(filteredDetections);
      } else {
        console.error('❌ YOLO Detection Failed!');
      }
    } catch (error) {
      console.error('❌ Error sending frame to YOLO:', error);
    }
  };
  
  const drawBoundingBoxes = (detections) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    const img = new Image();
    img.src = frameUrls[currentFrameIndex];

    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);

      detections.forEach((detection) => {
        const { x_min, y_min, x_max, y_max } = detection.bbox;

        context.strokeStyle = 'red';
        context.lineWidth = 2;
        context.strokeRect(x_min, y_min, x_max - x_min, y_max - y_min);

        context.fillStyle = 'red';
        context.font = 'bold 18px Arial';
        context.fillText(detection.class.trafficSign, x_min, y_min - 10);
      });
    };
  };

  useEffect(() => {
    loadFrameToCanvas();
  }, [currentFrameIndex, frameUrls]);

  return (
    <div className='loadInput'>
      {!totalFrames && (
        <>
          <h2 className='loadInputLabel'>Load Input Video</h2>
          <label htmlFor='inputButton' className='inputButton'> Choose File </label>
          <input type='file' id='inputButton' accept='video/*' onChange={handleFileChange}></input>
        </>
      )}

      {file && (
        <div className='videoInfo'>
          <p>File name: {file.name}</p>
          <p>File size: {(file.size / 1024).toFixed(2)} KB</p>
          <p>File type: {file.type}</p>
          <p>
            Frame {currentFrameIndex + 1} of {totalFrames}
          </p>
        </div>
      )}
      <canvas ref={canvasRef} style={{ border: '1px solid black' }} className='canvas'/>

      {totalFrames > 0 && (
        <div className='mediaPlayerButtonsContainer'>
          <button
            onClick={() => {
              handleNavigation('previous');
            }}
            disabled={currentFrameIndex === 0}
            className='mediaPlayerButton'
          >
            ⬅️ PREVIOUS
          </button>
          <button
            onClick={() => {
              handleNavigation('next');
            }}
            disabled={currentFrameIndex === totalFrames - 1}
            className='mediaPlayerButton'
          >
            NEXT ➡️
          </button>
        </div>
      )}

      
    </div>
  );
}

export default LoadInput;
