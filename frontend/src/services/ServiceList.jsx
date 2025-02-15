import React from 'react'
import ServiceCard from './ServiceCard'
import { Col } from 'reactstrap'
import weatherImg from '../assets/images/weather.png'
import guideImg from '../assets/images/guide.png'
import customizationImg from '../assets/images/customization.png'

const servicesData = [
   {
      imgUrl: weatherImg,
      title: `Calculate Weather`,
      desc: `Get accurate and up-to-date weather information for your travel destinations`,
   },
   {
      imgUrl: guideImg,
      title: `Best Tour Guide`,
      desc: `I will help you discover hidden gems and learn fascinating facts about each location.`,
   },
   {
      imgUrl: customizationImg,
      title: 'Customization',
      desc: `Tailor your journey to fit your unique preferences and interests.`,
   },
]

const ServiceList = () => {
   return <>
      {
         servicesData.map((item, index) => (
            <Col lg='3' md='6' sm='12' className='mb-4' key={index}>
               <ServiceCard item={item} />
            </Col>))
      }
   </>

}

export default ServiceList