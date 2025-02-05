import React, { useContext, useState } from 'react';
import '../assets/styles/TrafficSignInfo.css';
import TrafficSignCard from './TrafficSignCard';
import { TrafficSignContext } from './TrafficSignContext';
import TrafficSignCardModal from './TrafficSignCardModal';

function TrafficSignInformation() {
  const { detections, loading, croppedCanvas } = useContext(TrafficSignContext);
  const [selectedSign, setSelectedSign] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  
  return (
    <div className='trafficSignInformationContainer'>
      <span className='trafficSignInfoTitle'>Traffic Signs Ontology Details</span>
      <TrafficSignCardModal 
        sign={selectedSign} 
        croppedCanvas={croppedCanvas}
        onClose={() => setSelectedSign(null)} 
      />
      {
        !loading && detections?.length > 0 && (detections?.map((detection, index)=>{
          const {bbox, class: trafficSignClass, confidence, ontologyDetails} =  detection;
          return <TrafficSignCard key={index} id ={index} trafficSignClass={trafficSignClass['trafficSign']} ontologyDetails={ontologyDetails} confidence={confidence.toFixed(2)} onClick={() => setSelectedSign(detection)}/>;
        }))
      }

      {
        !loading && detections?.length == 0 && (<h1>No traffic signs to detect!</h1>)  
      }

      {
        loading && (<div className='loader'> </div>)
      }
    </div>
  );
}

export default TrafficSignInformation;