import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './parametres.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInbox, faPaperPlane, faCog, faSearch, faAngleLeft, faAngleRight, faSort, faEye,faFileImport
} from '@fortawesome/free-solid-svg-icons';
const Parametres = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch('/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUserData(prev => ({
          ...prev,
          name: data.name,
          email: data.email
        }));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || {});
        return;
      }

      setSuccessMessage('Paramètres mis à jour avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="compte-utilisateur">
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <img src="/images/logo.png" alt="Logo GEC_CTAMA" />
            <div className="logo-text">
              <div className="main">GEC_CTAMA</div>
              <div className="sub">Gestionnaire des courriers</div>
            </div>
          </div>
          <div className="user-menu">
            <div className="user-info">
              <div className="user-name">{userData.name}</div>
              <div className="user-email">{userData.email}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="main-container">
        <aside className="sidebar">
          <h2 className="sidebar-title">Menu</h2>
          <ul className="nav-menu">
        
                      <li className="nav-item"><a href="/compteutilisateur" ><FontAwesomeIcon icon={faInbox} /> Courriers reçus</a></li>
      
                     <li className="nav-item"><a href="/parametres"><FontAwesomeIcon icon={faCog} /> Paramètres</a></li>
                   </ul>
        </aside>

        <main className="content parametres-content">
          <h1 className="content-title">Paramètres <span>du compte</span></h1>
          
          {successMessage && (
            <div className="alert alert-success">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="parametres-form">
            <div className="form-section">
              <h3>Informations personnelles</h3>
              
              <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
                <label>Nom complet</label>
                <input
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleChange}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleChange}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>

            <div className="form-section">
              <h3>Changer le mot de passe</h3>
              
              <div className={`form-group ${errors.current_password ? 'has-error' : ''}`}>
                <label>Mot de passe actuel</label>
                <input
                  type="password"
                  name="current_password"
                  value={userData.current_password}
                  onChange={handleChange}
                />
                {errors.current_password && <span className="error-message">{errors.current_password}</span>}
              </div>

              <div className={`form-group ${errors.new_password ? 'has-error' : ''}`}>
                <label>Nouveau mot de passe</label>
                <input
                  type="password"
                  name="new_password"
                  value={userData.new_password}
                  onChange={handleChange}
                />
                {errors.new_password && <span className="error-message">{errors.new_password}</span>}
              </div>

              <div className={`form-group ${errors.new_password_confirmation ? 'has-error' : ''}`}>
                <label>Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  name="new_password_confirmation"
                  value={userData.new_password_confirmation}
                  onChange={handleChange}
                />
                {errors.new_password_confirmation && (
                  <span className="error-message">{errors.new_password_confirmation}</span>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Parametres;