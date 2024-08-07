import React, { useState, useContext } from 'react';
import { Container, Row, Col, Form, FormGroup, Button } from 'reactstrap';
import '../styles/login.css';
import { Link, useNavigate } from 'react-router-dom';
import registerImg from '../assets/images/login.png';
import userIcon from '../assets/images/user.png';
import { AuthContext } from '../context/AuthContext';
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://remain-faceghost.pockethost.io');

const Register = () => {
   const [credentials, setCredentials] = useState({
      username: '',
      email: '',
      emailVisibility: true,
      password: '',
      passwordConfirm: '',
      name: ''
   });

   const { dispatch } = useContext(AuthContext);
   const navigate = useNavigate();

   const handleChange = e => {
      setCredentials(prev => ({ ...prev, [e.target.id]: e.target.value }));
   };

   const handleClick = async e => {
      e.preventDefault();

      if (credentials.password !== credentials.passwordConfirm) {
         alert('Passwords do not match.');
         return;
      }

      try {
         const data = {
            username: credentials.username,
            email: credentials.email,
            emailVisibility: credentials.emailVisibility,
            password: credentials.password,
            passwordConfirm: credentials.passwordConfirm,
            name: credentials.name
         };

         const record = await pb.collection('users').create(data);

         if (record) {
            // Optional: send an email verification request
            await pb.collection('users').requestVerification(credentials.email);
            
            dispatch({ type: 'REGISTER_SUCCESS' });
            navigate('/login');
         }
      } catch (err) {
         console.error('Error creating record:', err);
         alert('Failed to create account. Please try again.');
      }
   };

   return (
      <section>
         <Container>
            <Row>
               <Col lg='8' className='m-auto'>
                  <div className="login__container d-flex justify-content-between">
                     <div className="login__img">
                        <img src={registerImg} alt="" />
                     </div>

                     <div className="login__form">
                        <div className="user">
                           <img src={userIcon} alt="" />
                        </div>
                        <h2>Register</h2>

                        <Form onSubmit={handleClick}>
                           <FormGroup>
                              <input type="text" placeholder='Username' id='username' onChange={handleChange} required />
                           </FormGroup>
                           <FormGroup>
                              <input type="text" placeholder='Name' id='name' onChange={handleChange} required />
                           </FormGroup>
                           <FormGroup>
                              <input type="email" placeholder='Email' id='email' onChange={handleChange} required />
                           </FormGroup>
                           <FormGroup>
                              <input type="password" placeholder='Password' id='password' onChange={handleChange} required />
                           </FormGroup>
                           <FormGroup>
                              <input type="password" placeholder='Confirm Password' id='passwordConfirm' onChange={handleChange} required />
                           </FormGroup>
                           <FormGroup check>
                              <label>
                                 <input type="checkbox" id='emailVisibility' checked={credentials.emailVisibility} onChange={e => setCredentials(prev => ({ ...prev, emailVisibility: e.target.checked }))} />
                                 Email Visibility
                              </label>
                           </FormGroup>
                           <Button className='btn secondary__btn auth__btn' type='submit'>Create Account</Button>
                        </Form>
                        <p>Already have an account? <Link to='/login'>Login</Link></p>
                     </div>
                  </div>
               </Col>
            </Row>
         </Container>
      </section>
   );
};

export default Register;
