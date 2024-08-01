import React from 'react'
import './footer.css'
import { Container, Row, Col, ListGroup, ListGroupItem } from 'reactstrap'
import { Link } from 'react-router-dom'
import logo from '../../assets/images/logo.png'

const quick__links = [
   {
      path: '/home',
      display: 'Home'
   },
   {
      path: '/about',
      display: 'About'
   },
   {
      path: '/tours',
      display: 'Tours'
   },
]

const quick__links2 = [
   {
      path: '/gallery',
      display: 'Gallery'
   },
   {
      path: '/login',
      display: 'Login'
   },
   {
      path: '/register',
      display: 'Register'
   },
]

const Footer = () => {
   const year = new Date().getFullYear()

   return (
      <footer className='footer'>
         <Container>
            <Row>
               <Col lg='3'>
                  <div className="logo">
                     <img src={logo} alt="Logo" />
                     <p>Unlocking unforgettable journeys with expert guidance and insider insights.</p>
                     <div className="social__link d-flex align-items-center gap-4">
                        <span>
                           <a href='https://www.tiktok.com/@infinity_wanderlust' target='_blank' rel='noopener noreferrer'>
                              <i className='ri-tiktok-line'></i>
                           </a>
                        </span>
                        <span>
                           <a href='https://www.instagram.com/infinity_wanderlust/' target='_blank' rel='noopener noreferrer'>
                              <i className='ri-instagram-line'></i>
                           </a>
                        </span>
                        <span>
                           <a href='https://x.com/kenyanetraveler' target='_blank' rel='noopener noreferrer'>
                              <i className='ri-twitter-line'></i>
                           </a>
                        </span>
                        <span>
                           <a href='mailto:infinitywanderlusttravels@gmail.com' target='_blank' rel='noopener noreferrer'>
                              <i className='ri-mail-line'></i>
                           </a>
                        </span>
                     </div>
                  </div>
               </Col>

               <Col lg='3'>
                  <h5 className="footer__link-title">Discover</h5>

                  <ListGroup className='footer__quick-links'>
                     {
                        quick__links.map((item, index) => (
                           <ListGroupItem key={index} className='ps-0 border-0'>
                              <Link to={item.path}>{item.display}</Link>
                           </ListGroupItem>
                        ))
                     }
                  </ListGroup>
               </Col>
               <Col lg='3'>
                  <h5 className="footer__link-title">Quick Links</h5>

                  <ListGroup className='footer__quick-links'>
                     {
                        quick__links2.map((item, index) => (
                           <ListGroupItem key={index} className='ps-0 border-0'>
                              <Link to={item.path}>{item.display}</Link>
                           </ListGroupItem>
                        ))
                     }
                  </ListGroup>
               </Col>
               <Col lg='3'>
                  <h5 className="footer__link-title">Contact</h5>

                  <ListGroup className='footer__quick-links'>
                     <ListGroupItem className='ps-0 border-0 d-flex align-items-center gap-3'>
                        <h6 className='mb-0 d-flex align-items-center gap-2'>
                           <span><i className='ri-map-pin-line'></i></span>
                           Address:
                        </h6>
                        <p className='mb-0'>Nairobi, Kenya</p>
                     </ListGroupItem>

                     <ListGroupItem className='ps-0 border-0 d-flex align-items-center gap-3'>
                        <h6 className='mb-0 d-flex align-items-center gap-2'>
                           <span><i className='ri-mail-line'></i></span>
                           Email:
                        </h6>
                        <p className='mb-0'>
                           <a href='mailto:infinitywanderlusttravels@gmail.com'>infinitywanderlusttravels@gmail.com</a>
                        </p>
                     </ListGroupItem>
                  </ListGroup>
               </Col>
            </Row>
         </Container>
         <div className="footer__bottom text-center mt-4">
            <p>&copy; {year} Infinity Wanderlust Travels. All rights reserved.</p>
         </div>
      </footer>
   )
}

export default Footer
