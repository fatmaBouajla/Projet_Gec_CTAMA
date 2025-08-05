import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './codepassword.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const VerificationCode = () => {
  const [code, setCode] = useState(new Array(6).fill(''));
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
  
      sendResetCode(location.state.email);
    } else {
      navigate('/forgotpassword');
    }
  }, [location, navigate]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const sendResetCode = async (email) => {
    try {
      await axios.get(`http://localhost:8000/api/ForgetPassword/${email}`);
      setSuccessMsg('Code envoyé à votre email');
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'envoi du code");
    }
  };

  const handleChange = (element, index) => {
    if (!/^[0-9]?$/.test(element.value)) return;
    const newCode = [...code];
    newCode[index] = element.value;
    setCode(newCode);

    if (element.value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSuccessMsg('');
  setIsLoading(true);

  if (code.includes('')) {
    setError('Veuillez remplir tous les champs du code.');
    setIsLoading(false);
    return;
  }

  const codeStr = code.join('');

  try {
    const response = await axios.post('http://localhost:8000/api/verify-reset-code', {
      email: email,
      code: codeStr
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (response.data.success) {
      setSuccessMsg('Code vérifié avec succès !');
      navigate('/nouveaupassword', {
        state: {
          email: email,
          token: response.data.token
        }
      });
    } else {
      setError(response.data.message || 'Code invalide. Veuillez réessayer.');
    }
  } catch (err) {
    console.error('Erreur complète:', err);
    console.error('Réponse erreur:', err.response);
    setError(err.response?.data?.message || "Erreur serveur, veuillez réessayer plus tard.");
  } finally {
    setIsLoading(false);
  }
};
  const handleResend = async () => {
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      await sendResetCode(email);
      setCode(new Array(6).fill(''));
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.error || "Impossible de renvoyer le code. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="logo-header">
        <img src="/images/logo.png" alt="Logo GEC_CTAMA" className="logo-img" />
        <div className="logo-text">
          <div className="logo-main">GEC_CTAMA</div>
          <div className="logo-sub">Gestionnaire des courriers</div>
        </div>
      </div>

      <div className="form-container">
        <h1>Vérification du <span className="hiii">code</span></h1>
        <p className="instructions">
          Nous avons envoyé un code à 6 chiffres à {email}. Entrez-le ci-dessous.
        </p>

        {error && <p className="alert error">{error}</p>}
        {successMsg && <p className="alert success">{successMsg}</p>}

        <form onSubmit={handleSubmit} id="verificationForm">
          <div className="code-inputs">
            {code.map((num, idx) => (
              <input
                key={idx}
                type="text"
                maxLength="1"
                pattern="[0-9]"
                value={num}
                onChange={(e) => handleChange(e.target, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                ref={(el) => (inputsRef.current[idx] = el)}
                required
                disabled={isLoading}
              />
            ))}
          </div>

          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? 'Vérification en cours...' : 'Vérifier le code'}
          </button>
        </form>

        <div className="resend-code">
          Vous n'avez pas reçu de code?{' '}
          <button 
            className="link-button" 
            onClick={handleResend}
            disabled={isLoading}
          >
            {isLoading ? 'Envoi en cours...' : 'Renvoyer le code'}
          </button>
        </div>

        <div className="back-link">
          <Link to="/forgotpassword">← Changer d'adresse email</Link>
        </div>
      </div>
    </div>
  );
};

export default VerificationCode;