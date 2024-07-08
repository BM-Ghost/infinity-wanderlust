import React, { useState, useRef, useEffect } from 'react';
import './Main.css';
import emailIcon from './images/email_icon.png';
import instagramIcon from './images/instagram_icon.png';
import tiktokIcon from './images/tiktok_icon.png';

const Main = () => {
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
    <div className="homepage">
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

      <div className="bio-section">
        <h2>Explore.Dream.Discover</h2>
        <p>Hello! I'm a travel enthusiast who loves exploring new places and cultures. I believe that travel is not just about visiting new places but about experiencing life in different ways.</p>
        <p>
          <a href="mailto:infinitywanderlusttravels@gmail.com"><img src={emailIcon} alt="Email" /></a>
          <a href="https://www.instagram.com/infinity_wanderlust/" target="_blank" rel="noopener noreferrer"><img src={instagramIcon} alt="Instagram" /></a>
          <a href="https://www.tiktok.com/@infinity_wanderlust" target="_blank" rel="noopener noreferrer"><img src={tiktokIcon} alt="TikTok" /></a>
        </p>
        <p>
          <a href="#explore-more" className="explore-more-link">Start Exploring</a>
        </p>
      </div>
    </div>
  );
};

export default Main;
