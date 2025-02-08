import React, { useRef, useState } from 'react';
import './search-bar.css';
import { Col, Form, FormGroup } from 'reactstrap';

const SearchBar = () => {
   const locationRef = useRef(null);
   const [loading, setLoading] = useState(false);
   const [articles, setArticles] = useState([]); // Store fetched articles

   const searchHandler = async () => {
      const location = locationRef.current?.value.trim();
      
      if (!location) {
         return alert('Please enter a location!');
      }
      
      setLoading(true);
      setArticles([]); // Clear previous search results

      try {
         const res = await fetch(`http://localhost:5000/api/travel-articles?location=${location}`);
         const data = await res.json();

         if (!res.ok) throw new Error(data.error || 'Failed to fetch articles');

         setArticles(data);
      } catch (error) {
         alert(error.message);
      } finally {
         setLoading(false);
      }
   };

   const handleSubmit = (e) => {
      e.preventDefault(); // Prevent page refresh
      searchHandler();
   };

   return (
      <Col lg="12">
         <div className="search__bar">
            <Form className='d-flex align-items-center gap-4' onSubmit={handleSubmit}>
               <FormGroup className='d-flex gap-3 form__group form__group-fast'>
                  <span><i className='ri-map-pin-line'></i></span>
                  <div>
                     <h6>Location</h6>
                     <input 
                        type="text" 
                        placeholder='Where are you going?' 
                        ref={locationRef} 
                        className='search-input'
                        onFocus={(e) => e.target.placeholder = ''} 
                        onBlur={(e) => e.target.placeholder = 'Where are you going?'}
                     />
                  </div>
               </FormGroup>

               {loading ? (
                  <span className='loading-icon'><i className='ri-loader-line ri-spin'></i></span>
               ) : (
                  <span className='search__icon' onClick={searchHandler}>
                     <i className='ri-search-line'></i>
                  </span>
               )}
            </Form>

            {/* Display Articles */}
            {articles.length > 0 && (
               <div className="articles__list">
                  <h5>Related Articles:</h5>
                  <div className="articles__grid">
                     {articles.map((article, index) => (
                        <div className="article__card" key={index}>
                           <a href={article.link} target="_blank" rel="noopener noreferrer">
                              <h6>{article.title}</h6>
                           </a>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>
      </Col>
   );
};

export default SearchBar;
