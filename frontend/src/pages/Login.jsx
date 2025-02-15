import React, { useContext, useState } from 'react';
import { Container, Row, Col, Form, FormGroup, Button, Spinner } from 'reactstrap';
import '../styles/login.css';
import { Link, useNavigate } from 'react-router-dom';
import loginImg from '../assets/images/login.png';
import userIcon from '../assets/images/user.png';
import { AuthContext } from '../context/AuthContext';
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://remain-faceghost.pockethost.io');

const Login = () => {
    const [credentials, setCredentials] = useState({
        email: '',
        password: '',
    });

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { dispatch } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleClick = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        dispatch({ type: 'LOGIN_START' });

        try {
            const authData = await pb.collection('users').authWithPassword(credentials.email, credentials.password);

            if (authData) {
                // Check if the user is verified
                if (!authData.record.verified) {
                    dispatch({ type: 'LOGIN_FAILURE', payload: 'User not verified' });
                    setError('Your account is not verified. Please check your email for verification.');
                    return;
                }

                dispatch({ type: 'LOGIN_SUCCESS', payload: authData.record });
                navigate('/home'); // Redirect to home on success
            }
        } catch (err) {
            dispatch({ type: 'LOGIN_FAILURE', payload: err.message });
            setError(err.message); // Show error message
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        setCredentials({
            email: '',
            password: '',
        });
        setError(null); // Clear the error message
    };

    return (
        <section>
            <Container>
                <Row>
                    <Col lg="8" className="m-auto">
                        <div className="login__container d-flex justify-content-between">
                            <div className="login__img">
                                <img src={loginImg} alt="Login Illustration" />
                            </div>

                            <div className="login__form">
                                <div className="user">
                                    <img src={userIcon} alt="User Icon" />
                                </div>
                                <h2>Login</h2>

                                {error && (
                                    <div className="error-message">
                                        <div className="error-header">
                                            <span>Error</span>
                                            <button onClick={() => setError(null)}>X</button>
                                        </div>
                                        <div className="error-body">
                                            <p style={{ color: 'black', fontFamily: 'Arial, sans-serif', fontSize: '16px' }}>{error}</p>
                                            <Button onClick={handleRetry} style={{ marginTop: '10px' }}>
                                                Try Again
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {!error && (
                                    <Form onSubmit={handleClick}>
                                        <FormGroup>
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                id="email"
                                                onChange={handleChange}
                                                required
                                                value={credentials.email}
                                            />
                                        </FormGroup>
                                        <FormGroup>
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                id="password"
                                                onChange={handleChange}
                                                required
                                                value={credentials.password}
                                            />
                                        </FormGroup>
                                        <Button className="btn secondary__btn auth__btn" type="submit" disabled={loading}>
                                            {loading ? <Spinner size="sm" /> : 'Login'}
                                        </Button>
                                    </Form>
                                )}

                                <p>
                                    Don't have an account? <Link to="/register">Create</Link>
                                </p>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default Login;
