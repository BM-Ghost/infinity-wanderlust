import React from 'react';
import NavBar from '../components/NavBar';
import SearchBar from '../components/SearchBar';
import TravelInfo from '../components/TravelInfo';
import './Home.css'; // Make sure this path is correct
import RecommendedPlaces from '../components/RecommendedPlaces';

const Home = () => {
  const handleSearch = (location) => {
    console.log(`Search for location: ${location}`);
    // Perform search action here
  };

  return (
    <div>
      <NavBar /> {/* Include NavBar at the top */}
      <SearchBar onSearch={handleSearch} />
      <RecommendedPlaces/>
      <TravelInfo />
    </div>
  );
};

export default Home;
