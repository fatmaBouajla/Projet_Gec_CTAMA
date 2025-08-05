import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './signup.css';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        service: '',
        position: '',
        password: '',
        confirmPassword: ''
    });

    const [services, setServices] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/services');
                setServices(response.data);
            } catch (err) {
                console.error('Erreur lors du chargement des services:', err);
            }
        };
        fetchServices();
    }, []);

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

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

        if (!formData.name || !formData.email || !formData.service || !formData.password || !formData.confirmPassword) {
            setError('Tous les champs obligatoires doivent être remplis');
            setIsLoading(false);
            return;
        }

        if (!validateEmail(formData.email)) {
            setError('Veuillez entrer une adresse email valide');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères');
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:8000/api/register', {
                name: formData.name,
                email: formData.email,
                service_nom: formData.service,
                position: formData.position || 'utilisateur',
                password: formData.password,
                password_confirmation: formData.confirmPassword,
            });

            if (response.data.message === 'User Registered Successfully') {
                navigate('/login', {
                    state: {
                        success: 'Un email de vérification a été envoyé. Veuillez vérifier votre boîte mail.'
                    }
                });
            } else {
                setError(response.data.message || 'La création du compte a échoué');
            }
        } catch (err) {
            if (err.response?.status === 422) {
                if (err.response.data?.errors?.email) {
                    setError('Cette adresse email est déjà utilisée par un autre compte');
                } else {
                    setError('Erreur de validation des données');
                }
            } else if (err.response?.data?.message?.toLowerCase().includes('email')) {
                setError('Cette adresse email est déjà associée à un compte existant');
            } else {
                setError(err.response?.data?.message || 'Une erreur est survenue lors de la création du compte');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-header">
                <img src="/images/logo.png" alt="Logo GEC_CTAMA" className="logo" />
                <div className="logo-text">
                    <h1>GEC_CTAMA</h1>
                    <p>Gestionnaire des courriers</p>
                </div>
            </div>

            <div className="signup-form">
                <h2>Créer un <span className="hii">compte</span></h2>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Nom complet *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email professionnel *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Service *</label>
                            <select
                                name="service"
                                value={formData.service}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Sélectionnez un service</option>
                                {services.map(service => (
                                    <option key={service.id} value={service.nom}>
                                        {service.nom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Position</label>
                            <input
                                type="text"
                                name="position"
                                value={formData.position}
                                onChange={handleChange}
                                placeholder="Ex: Gestionnaire, Agent..."
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Mot de passe (min. 8 caractères) *</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength="8"
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirmer le mot de passe *</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={isLoading ? 'loading' : ''}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner"></span>
                                Création en cours...
                            </>
                        ) : (
                            'Créer un compte'
                        )}
                    </button>
                </form>

                <div className="login-link">
                    Déjà un compte ? <a href="/login">Se connecter</a>
                </div>
            </div>
        </div>
    );
};

export default Signup;