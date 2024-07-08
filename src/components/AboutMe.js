import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AboutMe = () => {
  const [aboutMeData, setAboutMeData] = useState([]);

  const fetchAboutMeData = async () => {
    try {
      const response = await axios.get('http://localhost:1337/api/about-mes');
      // Adjust URL based on your Strapi setup
      setAboutMeData(response?.data?.data[0]?.attributes); // Adjust to match your API response structure
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  useEffect(() => {
    fetchAboutMeData();
  }, []);
  
  console.log("XXXXXXXXXXXXXXXXXX",aboutMeData)
  if (!aboutMeData) return <div>Loading...</div>;

  return (
    <div className="about-me-section">
      <div className="about-me-content">
        <div className="about-me-header">
          <img src={`http://localhost:1337${aboutMeData?.image?.data?.attributes?.url}`} alt="Glow" className="about-me-image" />
          <div className="about-me-title">
            <h2>{aboutMeData.Title}</h2>
            <h3>{aboutMeData.subtitle}</h3>
            <p>{aboutMeData.Description}</p>
          </div>
        </div>
        
        <div className="about-me-details">
          <h4>Some of my amazing experiences include:</h4>
          <ul>
            
              <li>{aboutMeData?.Experiences}</li>
         
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AboutMe;
