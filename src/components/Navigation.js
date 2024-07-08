// Navigation.js
import React, { useState, useRef, useEffect } from 'react';
import './Navigation.css';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="main-container">
      <div className="logo">Infinity Wanderlust</div>
      <div className="nav-icon" onClick={toggleMenu}>
        &#9776; {/* Unicode character for hamburger icon */}
      </div>
      <div ref={menuRef} className={`menu ${isMenuOpen ? 'active' : ''}`}>
        <div className="dropdown">
          <button className="dropbtn">Discover</button>
          <div className="dropdown-content">
            <a href="#!">Travel Experiences</a>
            <a href="#!">Places to Visit</a>
          </div>
        </div>
        <div className="dropdown">
          <button className="dropbtn">Plan Trip</button>
          <div className="dropdown-content">
            <a href="#!">Itineraries</a>
            <a href="#!">Travel Tips</a>
          </div>
        </div>
        <div className="dropdown">
          <button className="dropbtn">Review</button>
          <div className="dropdown-content">
            <a href="#!">Destination Reviews</a>
            <a href="#!">Travel Blog</a>
          </div>
        </div>
        <div className="dropdown">
          <button className="dropbtn">About</button>
        </div>
        <div className="dropdown">
          <button className="dropbtn">Contact</button>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
