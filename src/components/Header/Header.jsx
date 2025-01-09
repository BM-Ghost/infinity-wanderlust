import React, { useEffect, useRef, useContext, useState } from 'react'
import { Container, Row } from 'reactstrap'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import Logo from '../../assets/images/logo.png'
import { AuthContext } from '../../context/AuthContext'
import { RiUserLine } from 'react-icons/ri'

import './header.css'

const nav__links = [
  { path: '/home', display: 'Home' },
  { path: '/about', display: 'About' },
  { path: '/tours', display: 'Tours' },
]

const Header = () => {
  const headerRef = useRef(null)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const { user, dispatch } = useContext(AuthContext)

  const [showDropdown, setShowDropdown] = useState(false)

  const logout = () => {
    dispatch({ type: 'LOGOUT' })
    navigate('/login') // Redirect to login page after logout
  }

  const stickyHeaderFunc = () => {
    window.addEventListener('scroll', () => {
      if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {
        headerRef.current.classList.add('sticky__header')
      } else {
        headerRef.current.classList.remove('sticky__header')
      }
    })
  }

  const handleClickOutside = (e) => {
    if (!headerRef.current.contains(e.target)) {
      setShowDropdown(false)
    }
  }

  useEffect(() => {
    stickyHeaderFunc()
    document.addEventListener('click', handleClickOutside) // Listen for clicks outside the header
    return () => document.removeEventListener('click', handleClickOutside) // Cleanup event listener
  }, [])

  const toggleDropdown = () => setShowDropdown(!showDropdown)

  return (
    <header className="header" ref={headerRef}>
      <Container>
        <Row>
          <div className="nav__wrapper d-flex align-items-center justify-content-between">
            <div className="logo">
              <img src={Logo} alt="Logo" />
            </div>

            <div className="navigation" ref={menuRef}>
              <ul className="menu d-flex align-items-center gap-5">
                {nav__links.map((item, index) => (
                  <li className="nav__item" key={index}>
                    <NavLink
                      to={item.path}
                      className={(navClass) => (navClass.isActive ? 'active__link' : '')}
                    >
                      {item.display}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            <div className="nav__right d-flex align-items-center gap-4">
              {user ? (
                <div className="dropdown">
                  <h5 className="username mb-0" onClick={toggleDropdown}>
                    <RiUserLine /> {user.username} {/* Add the user icon */}
                  </h5>
                  <div className={`dropdown__menu ${showDropdown ? 'show' : ''}`}>
                    <Link to="/profile" onClick={() => setShowDropdown(false)}>Profile</Link>
                    <button onClick={() => { logout(); setShowDropdown(false); }}>Logout</button>
                  </div>
                </div>
              ) : (
                <div className="nav__btns d-flex align-items-center gap-2">
                  <Link to="/login" className="btn primary__btn">Login</Link>
                  <Link to="/register" className="btn primary__btn">Register</Link>
                </div>
              )}

              <span className="mobile__menu">
                <i className="ri-menu-line"></i>
              </span>
            </div>
          </div>
        </Row>
      </Container>
    </header>
  )
}

export default Header
