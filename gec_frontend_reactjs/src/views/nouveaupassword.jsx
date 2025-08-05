import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './nouveaupassword.css';

const NouveauPassword = () => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requirements, setRequirements] = useState({
    length: false,
    match: false
  });

  const navigate = useNavigate();
  const location = useLocation();

  const { state } = location;
  const email = state?.email || '';
  const token = state?.token || '';

  useEffect(() => {
    if (!email || !token) {
      navigate('/forgotpassword', { state: { error: 'Session invalide' } });
    }
  }, [email, token, navigate]);

  useEffect(() => {
    setRequirements({
      length: formData.newPassword.length >= 8,
      match: formData.newPassword === formData.confirmPassword && formData.confirmPassword !== ''
    });
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!requirements.length || !requirements.match) {
      setError('Le mot de passe ne respecte pas les exigences');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Envoi des données:', { email, token, password: formData.newPassword });

      const response = await axios.post('http://localhost:8000/api/ChangerPassword', {
        email,
        password: formData.newPassword,
        password_confirmation: formData.confirmPassword
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Réponse du serveur:', response.data);

      if (response.data?.data === 'Password Changed With success') {
        alert('Mot de passe modifié avec succès !');
        navigate('/login');
      } else {
        setError(response.data?.message || 'Erreur inconnue');
      }
    } catch (err) {
      console.error('Erreur complète:', {
        message: err.message,
        response: err.response?.data,
        config: err.config
      });

      const backendError = err.response?.data?.data ||
        err.response?.data?.message ||
        'Erreur serveur';

      setError(backendError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="logo-header">
        <img src="/images/logo.png" alt="Logo" className="logo-img" />
        <div className="logo-text">
          <div className="logo-main">GEC_CTAMA</div>
          <div className="logo-sub">Gestionnaire des courriers</div>
        </div>
      </div>

      <div className="form-container">
        <h1>Créer un nouveau <span>mot de passe</span></h1>
        <p className="instructions">Veuillez créer un nouveau mot de passe sécurisé pour votre compte.</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nouveau mot de passe</label>
            <div className="password-input-container">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                minLength="8"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                aria-label={showPasswords.new ? 'Masquer' : 'Afficher'}
              >
                {showPasswords.new ? '🙈' : '👁️'}
              </button>
            </div>
            <div className={`password-rule ${requirements.length ? 'valid' : ''}`}>
              • Minimum 8 caractères
            </div>
          </div>

          <div className="form-group">
            <label>Confirmer le mot de passe</label>
            <div className="password-input-container">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength="8"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                aria-label={showPasswords.confirm ? 'Masquer' : 'Afficher'}
              >
                {showPasswords.confirm ? '🙈' : '👁️'}
              </button>
            </div>
            <div className={`password-rule ${requirements.match ? 'valid' : ''}`}>
              • Les mots de passe correspondent
            </div>
          </div>

          <button
            type="submit"
            className="btn"
            disabled={!requirements.length || !requirements.match || isSubmitting}
          >
            {isSubmitting ? 'En cours...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NouveauPassword;