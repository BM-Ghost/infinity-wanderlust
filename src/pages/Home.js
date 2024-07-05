import React from 'react';
import './Home.css';
import Main from '../components/Main';

const Home = () => {
  const handleSearch = (location) => {
    console.log(`Search for location: ${location}`);
    
  };

  return (
    <div>
      <div className='homepage'>
      <Main />
      </div>
      
    </div>
  );
};

export default Home;
