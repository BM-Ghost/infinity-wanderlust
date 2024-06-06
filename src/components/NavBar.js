import React, { useState } from 'react';
import './NavBar.css';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">Travel Advisor</div>
        <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <li className="nav-item">
            <div className="nav-link" onClick={toggleDropdown}>Discover</div>
            {isOpen && (
              <ul className="dropdown">
                <li className="dropdown-item">Travel Experiences</li>
                <li className="dropdown-item">Places to Visit</li>
              </ul>
            )}
          </li>
          <li className="nav-item">Plan Trip</li>
          <li className="nav-item">Review</li>
          <li className="nav-item">Need Help?</li>
        </ul>
        <div className="nav-icon" onClick={toggleMenu}>
          <i className="fas fa-bars"></i>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
