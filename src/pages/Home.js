import React from 'react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import Map from '../components/Map';

const Home = () => {
  const handleSearch = (location) => {
    console.log(`Search for location: ${location}`);
    // Perform search action here
  };

  return (
    <div>
      <Header />
      <SearchBar onSearch={handleSearch} />
      <Map />
    </div>
  );
};

export default Home;
