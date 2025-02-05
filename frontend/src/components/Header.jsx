import React from 'react';
import '../assets/styles/Header.css';
import logo from '../assets/images/logo.png';
import uaic from '../assets/images/uaic.png';

function Header() {
  return (
    <div className='header'>
      <div className="logos">
        <img src={logo} alt='Logo' className='logo'/>
        <img src={uaic} alt='Uaic' className='logo' />
      </div>
      <div className='title'>
        Traffic sign smart detector
      </div>
    </div>
  );
}

export default Header;