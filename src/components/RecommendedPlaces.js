import React, { useRef } from 'react';
import './TravelInfo.css';

const RecommendedPlaces = () => {
  const categoriesRef = useRef(null);

  const handleScrollLeft = () => {
    categoriesRef.current.scrollBy({
      left: -300,
      behavior: 'smooth',
    });
  };

  const handleScrollRight = () => {
    categoriesRef.current.scrollBy({
      left: 300,
      behavior: 'smooth',
    });
  };

  return (
    <div>
      <h2>Recommended Places to Visit</h2>
      <div className="hotel-categories" ref={categoriesRef}>
      <div className="category">
          <img src="/images/eiffel_tower.jpg" alt="Top Hotels" />
          <h3>Top Hotels</h3>
          <p>Discover the best top hotels for a luxurious stay in 2024.</p>
        </div>
      <div className="category">
          <img src="/images/image1.jpg" alt="All-Inclusive Hotels" />
          <h3>All-Inclusive Hotels</h3>
          <p>Explore the finest all-inclusive hotels offering a complete vacation experience.</p>
        </div>
        <div className="category">
          <img src="/images/image1.jpg" alt="Family-Friendly Hotels" />
          <h3>Family-Friendly Hotels</h3>
        </div>
        <div className="category">
          <img src="/images/image1.jpg" alt="Luxury Hotels" />
          <h3>Luxury Hotels</h3>
          <p>Indulge in luxury and sophistication at the top-rated luxury hotels of 2024.</p>
        </div>
        <div className="category">
          <img src="/images/eiffel_tower.jpg" alt="Luxury Hotels" />
          <h3>Luxury Hotels</h3>
        </div>
      </div>
      <div className="scroll-buttons">
        <button className="scroll-left" onClick={handleScrollLeft}>
          <i className="arrow left"></i>
        </button>
        <button className="scroll-right" onClick={handleScrollRight}>
          <i className="arrow right"></i>
        </button>
      </div>
    </div>
  );
};

export default RecommendedPlaces;
