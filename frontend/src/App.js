import './assets/styles/App.css';
import Header from './components/Header';
import LoadInput from './components/LoadInput';
import { TrafficSignProvider } from './components/TrafficSignContext';
import TrafficSignInformation from './components/TrafficSignInformation';

function App() {
  return (
    <TrafficSignProvider>
      <div className="App">
        <Header/>
        <div className='mainContainer'>
          <LoadInput/>
          <TrafficSignInformation/>
        </div>
      </div>
    </TrafficSignProvider>
  );
}

export default App;
