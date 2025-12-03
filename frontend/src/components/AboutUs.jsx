import React from 'react';
import '../styles/AboutUs.css';
import element1 from '../assets/WAM_Element_1.png';
import element2 from '../assets/WAM_Element_2.png';

const AboutUs = () => {
  return (
    <div className="about-us-container">
      <img src={element1} alt="" className="decoration-element element1-top" />
      <img src={element2} alt="" className="decoration-element element2-top" />
      <img src={element1} alt="" className="decoration-element element1-bottom" />
      <img src={element2} alt="" className="decoration-element element2-bottom" />

      <div className="content-container">
        <h1>ABOUT US</h1>
        <hr />
        <p>
          Walk A Mile was created by four former International Student Advisors from the
          University of Helsinki’s International Student Advice team. The game was originally
          developed for a workshop at the Spring Forum for Higher Education International
          Affairs 2025 in Finland, themed “Internationalisation as a Force for Change.”
        </p>
        <p>
          As advisors, we listened to the stories of international students, learned about their
          challenges, and helped them navigate life in a new country. Having all been
          international students ourselves, we also understood these experiences on a personal level.
        </p>
        <p>
          Together, we set out to design a game that could help our colleagues - especially those
          who might not have lived these experiences - better understand what it’s like to move to
          Finland as an international student. Through Walk A Mile, we aim to spark empathy, deepen
          understanding, and foster greater cultural sensitivity among those who work with
          international students.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
