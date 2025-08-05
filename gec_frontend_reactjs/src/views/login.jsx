import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = location.state?.success;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/login', formData);
      
      const { user, token } = response.data.data;
      const role = user.role; 
      const position = user.position;

      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(user));

      if (role === 'admin') {
        navigate('/compteadmin');
      } else if (position === 'gestionnaire') {
        navigate('/comptegestionnaire');
      } else {
        navigate('/compteutilisateur');
      }
    } catch (err) {
      setError(err.response?.data?.message || 
               err.message || 
               'Erreur lors de la connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        navigate('/login', { state: {} });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, navigate]);

  return (
    <div className="login-container">
      <div className="logo-header">
        <img src={process.env.PUBLIC_URL + "/images/logo.png"} alt="Logo GEC_CTAMA" className="logo-img" />
        <div className="logo-text">
          <div className="logo-main">GEC_CTAMA</div>
          <div className="logo-sub">Gestionnaire des courriers</div>
        </div>
      </div>

      <div className="form-container">
        <h1>Connexion à votre <span className="rr">compte</span></h1>

        {successMessage && (
          <div className="alert success">{successMessage}</div>
        )}

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email professionnel</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn" 
            disabled={isLoading}
          >
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>

          <div className="links">
            <a href="/forgotpassword">Mot de passe oublié ?</a>
            <a href="/signup">Créer un compte</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;