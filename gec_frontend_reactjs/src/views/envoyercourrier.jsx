import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import './envoyercourrier.css';

const EnvoyerCourrier = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferDetails, setTransferDetails] = useState(null);

  const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    timeout: 10000,
  });

  useEffect(() => {
    const initialize = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      api.interceptors.request.use(config => {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers['Content-Type'] = 'application/json';
        return config;
      });

      try {
        const userResponse = await api.get('/user');
        setCurrentUser(userResponse.data);
      } catch (error) {
        console.error("Erreur de récupération de l'utilisateur", error);
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/login');
        }
      }
    };

    initialize();
  }, [navigate]);

  useEffect(() => {
    if (!currentUser || !state?.serviceName || !state?.courrierId) return;

    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get(`/services/${encodeURIComponent(state.serviceName)}/users`);
      
        const usersData = Array.isArray(response.data) 
          ? response.data 
          : response.data?.users || [];
        
        setUsers(usersData.filter(user => user.id !== currentUser.id));

      } catch (error) {
        handleError(error, "Erreur de chargement des destinataires");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [state, currentUser]);

  const handleError = (error, defaultMessage) => {
    console.error('Erreur:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      navigate('/login');
      return;
    }

    setError(
      error.response?.data?.message || 
      error.response?.data?.error || 
      defaultMessage
    );
  };

  const createTransfer = async (userId) => {
    try {
      const response = await api.post('/transferts', {
        courrier_id: state.courrierId,
        expediteur_id: currentUser.id,
        destinataire_id: userId,
        statut: 'transfere',
        commentaire: state.commentaire || '',
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        userId,
        error: error.response?.data || { message: error.message }
      };
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setError("Session invalide");
      return;
    }

    if (selectedUsers.length === 0) {
      setError("Sélectionnez au moins un destinataire");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const results = await Promise.all(
        selectedUsers.map(userId => createTransfer(userId))
      );

      const failedTransfers = results.filter(r => !r.success);
      if (failedTransfers.length > 0) {
        const errorDetails = failedTransfers.map(f => 
          `• ${users.find(u => u.id === f.userId)?.name || f.userId}: ${f.error.message || 'Erreur inconnue'}`
        ).join('\n');
        
        throw new Error(
          `${failedTransfers.length} transfert(s) échoué(s):\n${errorDetails}`
        );
      }

      setTransferSuccess(true);
      setTransferDetails({
        courrierId: state.courrierId,
        objet: state.objet,
        expediteur: currentUser.name,
        destinatairesCount: selectedUsers.length,
        serviceName: state.serviceName
      });

    } catch (error) {
      setError(error.message);
    } finally {
      setSending(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleReturn = () => {
    setTransferSuccess(false);
    navigate('/comptegestionnaire');
  };

  return (
    <div className="creer-courrier-page">
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <img src="/images/logo.png" alt="Logo" />
            <div className="logo-text">
              <div className="main">GEC_CTAMA</div>
              <div className="sub">Gestionnaire des courriers</div>
            </div>
          </div>
        </div>
      </header>

      <main className="main-container">
        {transferSuccess ? (
          <div className="confirmation-container">
            <div className="confirmation-card">
              <div className="confirmation-header">
                <FaCheckCircle className="success-icon" />
                <h2>Transfert effectué avec succès</h2>
              </div>
              
              <div className="confirmation-details">
                <div className="detail-row">
                  <span className="detail-label">Objet du Courrier:</span>
                  <span className="detail-value">{transferDetails.objet}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Service:</span>
                  <span className="detail-value">{transferDetails.serviceName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Nombre de destinataires:</span>
                  <span className="detail-value">{transferDetails.destinatairesCount}</span>
                </div>
              </div>

              <button 
                onClick={handleReturn}
                className="return-button"
              >
                <FaArrowLeft className="return-icon" />
                Retour à l'accueil
              </button>
            </div>
          </div>
        ) : (
          <div className="creation-form">
            <h1>Transfert vers: <span className="highlight">{state?.serviceName}</span></h1>
            
            {error && (
              <div className="error-message">
                <pre>{error}</pre>
                <button onClick={() => setError(null)} className="close-btn">×</button>
              </div>
            )}

            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Chargement des destinataires...</p>
              </div>
            ) : users.length > 0 ? (
              <>
                <div className="users-grid">
                  {users.map(user => (
                    <div 
                      key={user.id} 
                      className={`user-card ${selectedUsers.includes(user.id) ? 'selected' : ''}`}
                      onClick={() => toggleUserSelection(user.id)}
                    >
                      <div className="user-info">
                        <h3>{user.nom || user.name}</h3>
                        <p>{user.email}</p>
                        <span className={`role-badge ${user.role}`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <div className="check-icon">✓</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="selection-summary">
                  {selectedUsers.length} {selectedUsers.length > 1 ? 'destinataires' : 'destinataire'} sélectionné(s)
                </div>

                <div className="form-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => navigate(-1)}
                    disabled={sending}
                  >
                    Annuler
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={sending || selectedUsers.length === 0}
                  >
                    {sending ? (
                      <>
                        <span className="spinner-btn"></span>
                        Transfert en cours...
                      </>
                    ) : (
                      'Confirmer le transfert'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p className="empty-message">Aucun destinataire disponible dans ce service</p>
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate(-1)}
                >
                  Retour
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default EnvoyerCourrier;