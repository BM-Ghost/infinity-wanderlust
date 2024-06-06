// src/components/SearchBar.js
import React from 'react';
import { TextField, Button } from '@mui/material';

const SearchBar = ({ onSearch }) => {
  const [location, setLocation] = React.useState('');

  const handleSearch = () => {
    onSearch(location);
  };

  return (
    <div>
      <TextField
        label="Enter a location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <Button variant="contained" color="primary" onClick={handleSearch}>
        Search
      </Button>
    </div>
  );
};

export default SearchBar;
