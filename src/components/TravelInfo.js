import React from 'react';
import './TravelInfo.css'; // Import the CSS file for styling

const TravelInfo = () => {
  const tourismSites = [
    {
      name: 'Eiffel Tower',
      description: 'Iconic iron lattice tower in Paris',
      imageUrl: '/images/eiffel_tower.jpg',
      moreInfo: 'https://en.wikipedia.org/wiki/Eiffel_Tower',
    },
    // Add more tourism sites here
  ];

  return (
    <div>
      <h2>Visit these places</h2>
      <div className="site-grid">
        {tourismSites.map((site, index) => (
          <div key={index} className="site-item">
            {/* Apply responsive styling to the image */}
            <img className="site-image" src={site.imageUrl} alt={site.name} />
            <h3>{site.name}</h3>
            <p>{site.description}</p>
            <a href={site.moreInfo} target="_blank" rel="noopener noreferrer">
              More Info
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TravelInfo;
