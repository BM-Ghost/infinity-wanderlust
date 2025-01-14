import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { Container, Row, Col, Button } from 'reactstrap';

const Settings = () => {
  const { theme, language, changeTheme, changeLanguage } = useContext(ThemeContext);

  const themes = ['light', 'dark', 'dark-green'];
  const languages = ['en', 'es', 'fr', 'de'];

  return (
    <Container>
      <Row>
        <Col>
          <h2>Settings</h2>
          <div className="settings">
            <h4>Select Theme</h4>
            <div className="theme-options">
              {themes.map((t) => (
                <Button
                  key={t}
                  color={t === theme ? 'primary' : 'secondary'}
                  onClick={() => changeTheme(t)}
                  className="me-2"
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="settings mt-4">
            <h4>Select Language</h4>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="form-select"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;
