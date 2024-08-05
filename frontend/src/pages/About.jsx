import '../styles/about.css'
import { Container, Row, Col } from 'reactstrap'
import Subtitle from './../shared/subtitle'
import worldImg from '../assets/images/world.png'
import experienceImg from '../assets/images/experience.png'

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
                  </div>
               </Col>
            </Row>
         </Container>
      </section>
      <section>
         <Container>
            <Row>
               <Col lg='12'>
                  <div className="hero__content">
                     <h1> <span className='highlight'> Tap to connect with me!</span></h1>
                     
                  </div>
               </Col>
            </Row>
         </Container>
      </section>
    </>
}

export default About
