import React, { useState, useEffect, useRef } from 'react';
import './NavBar.css';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);
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
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-icon" onClick={toggleMenu}>
          <i className="fas fa-bars"></i>
        </div>
        <div className="nav-logo">Infinity Wanderlust</div>
        <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`} ref={menuRef}>
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
      </div>
    </nav>
  );
};

export default NavBar;
