// src/pages/Home.js

import React from 'react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import TravelInfo from '../components/TravelInfo'; // Import the TravelInfo component

const Home = () => {
  const handleSearch = (location) => {
    console.log(`Search for location: ${location}`);
    // Perform search action here
  };

  return (
    <div>
      <Header />
      <SearchBar onSearch={handleSearch} />
      <div className="content">
        <div className="left-panel">
          <TravelInfo />
        </div>
        <div className="right-panel">
          {/* You can keep your existing content here */}
        </div>
      </div>
    </div>
  );
};

export default Home;