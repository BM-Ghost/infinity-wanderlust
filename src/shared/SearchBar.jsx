import React, { useRef, useState } from 'react';
import './search-bar.css';
import { Col, Form, FormGroup } from 'reactstrap';
import { BASE_URL } from '../utils/config';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
   const locationRef = useRef(null);
   const [loading, setLoading] = useState(false);
   const navigate = useNavigate();

   const searchHandler = async () => {
      const location = locationRef.current?.value;
      
      if (!location) {
         return alert('Please enter a location!');
      }
      
      setLoading(true);
      try {
         const res = await fetch(`${BASE_URL}/articles/search?query=${location}`);
         
         if (!res.ok) {
            throw new Error('Failed to fetch articles');
         }
         
         const result = await res.json();
         navigate(`/articles/search?query=${location}`, { state: result.data });
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
         </div>
      </Col>
   );
};

export default SearchBar;
