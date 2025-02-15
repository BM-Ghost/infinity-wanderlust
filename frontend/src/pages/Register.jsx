import React, { useState, useContext, useEffect } from 'react';
import { Container, Row, Col, Form, FormGroup, Button, Spinner } from 'reactstrap';
import '../styles/login.css';
import { Link, useNavigate } from 'react-router-dom';
import registerImg from '../assets/images/login.png';
import userIcon from '../assets/images/user.png';
import { AuthContext } from '../context/AuthContext';
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://remain-faceghost.pockethost.io');
const hunterApiKey = '572557b3f832258066fb2fe92f863a806e13c57f';

const Register = () => {
    const [credentials, setCredentials] = useState({
        username: '',
        email: '',
        emailVisibility: true,
        password: '',
        passwordConfirm: '',
        name: ''
    });
    const [showVerification, setShowVerification] = useState(false);
    const [timer, setTimer] = useState(120);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { dispatch } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        let countdown;
        if (showVerification && timer > 0) {
            countdown = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            clearInterval(countdown);
        }
        return () => clearInterval(countdown);
    }, [showVerification, timer]);

    const handleChange = e => {
        setCredentials(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleClick = async e => {
        e.preventDefault();

        if (credentials.password !== credentials.passwordConfirm) {
            alert('Passwords do not match.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Step 1: Verify email with Hunter.io
            const emailVerificationResponse = await fetch(
                `https://api.hunter.io/v2/email-verifier?email=${credentials.email}&api_key=${hunterApiKey}`
            );
            const verificationResult = await emailVerificationResponse.json();
            const acceptAll = verificationResult.data?.status === 'accept_all';

            if ((!verificationResult.data || verificationResult.data.result !== 'deliverable') && !acceptAll) {
                setError({ message: verificationResult.data?.status || 'Invalid email address. Please provide a valid email.' });
                setLoading(false);
                return;
            }

            // Step 2: Proceed with PocketBase registration
            const data = {
                username: credentials.username,
                email: credentials.email,
                emailVisibility: true,
                password: credentials.password,
                passwordConfirm: credentials.passwordConfirm,
                name: credentials.name,
            };

            const record = await pb.collection('users').create(data);

            if (record) {
                await pb.collection('users').requestVerification(credentials.email);
                setShowVerification(true);
            }
        } catch (err) {
            console.error('Error creating record:', err);
            setError({ message: err.message || 'Failed to create account. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async e => {
        e.preventDefault();
        dispatch({ type: 'REGISTER_SUCCESS' });
        navigate('/login');
    };

    const resendVerificationEmail = async () => {
        try {
            await pb.collection('users').requestVerification(credentials.email);
            setTimer(120);
        } catch (err) {
            console.error('Error resending verification email:', err);
            alert('Failed to resend verification email. Please try again.');
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
                            {error && (
                                <div className="error-message">
                                    <div className="error-header">
                                        <span>Error</span>
                                        <button onClick={() => setError(null)}>X</button>
                                    </div>
                                    <div className="error-body">
                                        <p>{error.message}</p>
                                        <Button onClick={() => { setError(null); setShowVerification(false); }}>Try Again</Button>
                                    </div>
                                </div>
                            )}
                            {!error && !showVerification ? (
                                <div className="login__form">
                                    <div className="user">
                                        <img src={userIcon} alt="" />
                                    </div>
                                    <h2>Register</h2>

                                    {loading ? (
                                        <div className="loading-spinner">
                                            <Spinner />
                                        </div>
                                    ) : (
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
                                            <Button className='btn secondary__btn auth__btn' type='submit'>Create Account</Button>
                                        </Form>
                                    )}
                                    <p>Already have an account? <Link to='/login'>Login</Link></p>
                                </div>
                            ) : (
                                !error && showVerification && (
                                    <div className="login__form">
                                        <h2>Verify Your Email</h2>
                                        <p>A verification link has been sent to your email. Please verify your email.</p>
                                        <Form onSubmit={handleVerification}>
                                            <Button className='btn secondary__btn auth__btn' type='submit'>Verified</Button>
                                        </Form>
                                        <p>
                                            {timer > 0
                                                ? `You can resend the email in ${Math.floor(timer / 60)}:${timer % 60 < 10 ? '0' : ''}${timer % 60}`
                                                : <Button onClick={resendVerificationEmail}>Resend</Button>
                                            }
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default Register;
