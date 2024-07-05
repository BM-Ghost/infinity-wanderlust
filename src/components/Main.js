import React, { useState, useEffect, useRef } from 'react';
import './Main.css';
import emailIcon from './images/email_icon.png';
import instagramIcon from './images/instagram_icon.png';
import tiktokIcon from './images/tiktok_icon.png';

const Main = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false);
      setActiveDropdown(null);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
    setActiveDropdown(null);
  };

  const handleDropdownClick = (dropdownName) => {
    if (activeDropdown === dropdownName) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(dropdownName);
    }
  };

  return (
    <div className="homepage">
      <div className="main-container">
        <div className="nav-icon" onClick={toggleMenu}>
          &#9776; {/* Unicode character for hamburger icon */}
        </div>
        <div className="logo">Infinity Wanderlust</div>
        <ul ref={menuRef} className={`menu ${isMenuOpen ? 'active' : ''}`}>
          <li className="item">
            <div className="nav-link" onClick={() => handleDropdownClick('discover')}>
              Discover
            </div>
            {activeDropdown === 'discover' && (
              <ul className="dropdown">
                <li className="dropdown-item" onClick={handleLinkClick}>Travel Experiences</li>
                <li className="dropdown-item" onClick={handleLinkClick}>Places to Visit</li>
              </ul>
            )}
          </li>
          <li className="item">
            <div className="nav-link" onClick={() => handleDropdownClick('planTrip')}>
              Plan Trip
            </div>
          </li>
          <li className="item">
            <div className="nav-link" onClick={() => handleDropdownClick('review')}>
              Review
            </div>
          </li>
          <li className="item">
            <div className="nav-link" onClick={() => handleDropdownClick('needHelp')}>
              Need Help?
            </div>
          </li>
        </ul>
      </div>

      <div className="bio-section">
        <h2 style={{ fontSize: '43px', textAlign: 'center', marginBottom: '20px' }}>Explore.Dream.Discover</h2>
        <p style={{ textAlign: 'center', fontFamily: 'Open Sans', fontSize: '18px', marginBottom: '20px' }}>
          Hello! I'm a travel enthusiast who loves exploring new places and cultures. I believe that travel is not just about visiting new places but about experiencing life in different ways.
        </p>
        <p style={{ textAlign: 'center', marginBottom: '20px' }}>
        <a href="mailto:infinitywanderlusttravels@gmail.com"><img src={emailIcon} alt="Email" /></a>
        <a href="https://www.instagram.com/infinity_wanderlust/" target="_blank" rel="noopener noreferrer"><img src={instagramIcon} alt="Instagram" /></a>
        <a href="https://www.tiktok.com/@infinity_wanderlust" target="_blank" rel="noopener noreferrer"><img src={tiktokIcon} alt="TikTok" /></a>
        </p>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          <a href="#explore-more" className="explore-more-link">Start Exploring</a>
        </p>
      </div>
    </div>
  );
};

export default Main;
