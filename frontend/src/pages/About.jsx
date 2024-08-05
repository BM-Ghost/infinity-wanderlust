import '../styles/about.css'
import { Container, Row, Col } from 'reactstrap'
import Subtitle from './../shared/subtitle'
import worldImg from '../assets/images/world.png'
import experienceImg from '../assets/images/experience.png'
import '../components/Footer/footer.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram, faTwitter, faTiktok } from '@fortawesome/free-brands-svg-icons'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'

const About = () => {
    return <>
    {/* ========== EXPERIENCE SECTION ========== */}
      <section>
         <Container>
            <Row>
               <Col lg='12'>
                  <div className="hero__content">
                     <div className="hero__subtitle d-flex align-items-center">
                        <Subtitle subtitle={'Hello 👋🏽'} />
                        <img src={worldImg} alt="World" />
                     </div>
                     <h1>I am <span className='highlight'> Infinity Wanderlust</span></h1>
                     <p>
                     <img src={experienceImg} alt="Experience" className="experience__image"/>
                     I'm a travel enthusiast who loves exploring new places and cultures. I believe that travel is not just about visiting new places but about experiencing life in different ways. 
                     </p>
                     <br></br>
                     <p>Join me in my adventures as I share my experiences and tips on traveling around the world. With each journey, I discover new perspectives and learn valuable lessons that I’m excited to share with you. From hidden gems to well-known landmarks, I’ll guide you through the best experiences the world has to offer.</p>
                     <h2> <span className='highlight'> Tap to connect with me!</span></h2>
                     <div className="social__link d-flex align-items-center gap-4">
                        <span>
                           <a href='https://www.tiktok.com/@infinity_wanderlust' target='_blank' rel='noopener noreferrer'>
                              <FontAwesomeIcon icon={faTiktok} />
                           </a>
                        </span>
                        <span>
                           <a href='https://www.instagram.com/infinity_wanderlust/' target='_blank' rel='noopener noreferrer'>
                              <FontAwesomeIcon icon={faInstagram} />
                           </a>
                        </span>
                        <span>
                           <a href='https://x.com/kenyanetraveler' target='_blank' rel='noopener noreferrer'>
                              <FontAwesomeIcon icon={faTwitter} />
                           </a>
                        </span>
                        <span>
                           <a href='mailto:infinitywanderlusttravels@gmail.com' target='_blank' rel='noopener noreferrer'>
                              <FontAwesomeIcon icon={faEnvelope} />
                           </a>
                        </span>
                     </div>

                  </div>
               </Col>
            </Row>
         </Container>
      </section>
    </>
}

export default About
