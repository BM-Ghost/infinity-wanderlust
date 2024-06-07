import React, { useState, useEffect, useRef } from 'react';
import './NavBar.css';

const NavBar = () => {
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
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-icon" onClick={toggleMenu}>
          <i className="fas fa-bars"></i>
        </div>
        <div className="nav-logo">Infinity Wanderlust</div>
        <ul ref={menuRef} className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <li className="nav-item">
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
          <li className="nav-item">
            <div className="nav-link" onClick={() => handleDropdownClick('planTrip')}>
              Plan Trip
            </div>
          </li>
          <li className="nav-item">
            <div className="nav-link" onClick={() => handleDropdownClick('review')}>
              Review
            </div>
          </li>
          <li className="nav-item">
            <div className="nav-link" onClick={() => handleDropdownClick('needHelp')}>
              Need Help?
            </div>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
