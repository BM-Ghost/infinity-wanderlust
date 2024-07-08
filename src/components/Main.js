// Main.js
import React from 'react';
import './Main.css';
import Navigation from './Navigation';
import emailIcon from './images/email_icon.png';
import instagramIcon from './images/instagram_icon.png';
import tiktokIcon from './images/tiktok_icon.png';

const Main = () => {
  return (
    <div className="homepage">
      <Navigation />
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
