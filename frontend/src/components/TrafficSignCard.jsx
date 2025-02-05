import '../assets/styles/TrafficSignCard.css';

function TrafficSignCard({id, trafficSignClass, ontologyDetails, onClick }) {
  return (
    <div className='trafficSignCard' onClick={onClick}>
      <span className='trafficSignId'>{`${id+1}. ${trafficSignClass}`}</span>
      <div className="trafficSignOntologyDetails">
        <div className="ontologyItem">
          <span className='ontologyItemName'> Description: </span>
          <span> {ontologyDetails['description']} </span>
        </div>
      </div>
    </div>
  );
}

export default TrafficSignCard;