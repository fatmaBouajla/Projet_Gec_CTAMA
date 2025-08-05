import React, { useState } from 'react';
import './forgotpassword.css';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!email.includes('@') || !email.includes('.')) {
            setError('Veuillez entrer une adresse email valide');
            setIsLoading(false);
            return;
        }

     
        navigate('/codepassword', { state: { email } });
        setIsLoading(false);
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
                <h1>Réinitialiser votre <span className="hi">mot de passe</span></h1>
                <p className="instructions">
                    Entrez votre adresse email associée à votre compte. Nous vous enverrons un code.
                </p>

                {error && <p className="alert error">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Adresse email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="votre@email.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value.trim())}
                            disabled={isLoading}
                        />
                    </div>
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Envoi en cours...' : 'Envoyer le code de réinitialisation'}
                    </button>
                </form>

                <div className="back-link">
                    <Link to="/login">← Retour à la page de connexion</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;