import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './parametresadmin.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTachometerAlt, faUsersCog, faBuilding, faCogs, faClipboardList,
  faUserCog, faShieldAlt, faServer, faDatabase, faSave, faTimes,
  faLock, faEye, faEyeSlash, faDownload, faUpload
} from '@fortawesome/free-solid-svg-icons';

const ParametresAdmin = () => {
  const [activeTab, setActiveTab] = useState('compte');
  const [adminData, setAdminData] = useState({
    name: 'Admin Système',
    email: 'admin@ctama.com',
    position: 'ADMIN'
  });
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [systemData, setSystemData] = useState({
    systemName: 'GEC_CTAMA',
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lastUpdate: '15/06/2023',
    database: 'MariaDB 10.4.32'
  });
  const [backupData, setBackupData] = useState({
    frequency: 'weekly',
    type: 'partial',
    location: 'cloud',
    backups: [
      { date: '14/06/2023 02:00', type: 'Automatique (Complète)', size: '1.2 GB' },
      { date: '07/06/2023 02:00', type: 'Automatique (Complète)', size: '1.1 GB' }
    ]
  });
  const [passwordVisible, setPasswordVisible] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Charger les données admin depuis l'API
    const fetchAdminData = async () => {
      try {
        const response = await axios.get('/api/admin/settings', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setAdminData(response.data.admin);
        setSystemData(response.data.system);
        setBackupData(response.data.backup);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };
    
    fetchAdminData();
  }, []);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisible({
      ...passwordVisible,
      [field]: !passwordVisible[field]
    });
  };

  const handleAdminUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put('/api/admin/update', adminData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      alert('Informations mises à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      const response = await axios.put('/api/admin/update-password', {
        current_password: securityData.currentPassword,
        new_password: securityData.newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      alert('Mot de passe mis à jour avec succès');
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      alert(error.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe');
    }
  };

  const handleSystemUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put('/api/admin/system-settings', systemData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      alert('Paramètres système mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres système:', error);
      alert('Erreur lors de la mise à jour des paramètres système');
    }
  };

  const handleBackup = async () => {
    try {
      const response = await axios.post('/api/admin/backup', {
        frequency: backupData.frequency,
        type: backupData.type,
        location: backupData.location
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      alert('Sauvegarde lancée avec succès');
      // Actualiser la liste des sauvegardes
      const backupsResponse = await axios.get('/api/admin/backups');
      setBackupData({ ...backupData, backups: backupsResponse.data });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
      axios.post('/logout', {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(() => {
        localStorage.removeItem('token');
        navigate('/login');
      }).catch(error => {
        console.error('Erreur lors de la déconnexion:', error);
      });
    }
  };

  return (
    <div className="admin-container">
      {/* Header */}
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
              <div>
                <span className="user-name">{adminData.name}</span>
                <span className="user-role">{adminData.position}</span>
              </div>
              <div className="user-email">{adminData.email}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="main-container">
 
        <aside className="sidebar">
          <h2 className="sidebar-title">Menu Admin</h2>
          <ul className="nav-menu">
        
            <li className="nav-item">
              <a href="/compteadmin">
                <FontAwesomeIcon icon={faUsersCog} /> Gestion utilisateurs
              </a>
            </li>
            <li className="nav-item">
              <a href="/gestionservice">
                <FontAwesomeIcon icon={faBuilding} /> Gestion services
              </a>
            </li>
            <li className="nav-item">
              <a href="/parametresadmin" className="active">
                <FontAwesomeIcon icon={faCogs} /> Paramètres système
              </a>
            </li>
          
          </ul>
        </aside>

     
        <main className="content">
          <div className="content-header">
            <h1 className="content-title">Paramètres <span>Administrateur</span></h1>
          </div>

          <div className="settings-tabs">
            <div 
              className={`tab ${activeTab === 'compte' ? 'active' : ''}`} 
              onClick={() => handleTabChange('compte')}
            >
              Mon compte
            </div>
            <div 
              className={`tab ${activeTab === 'securite' ? 'active' : ''}`} 
              onClick={() => handleTabChange('securite')}
            >
              Sécurité
            </div>
            <div 
              className={`tab ${activeTab === 'systeme' ? 'active' : ''}`} 
              onClick={() => handleTabChange('systeme')}
            >
              Système
            </div>
          
          </div>


          <div id="compte" className={`tab-content ${activeTab === 'compte' ? 'active' : ''}`}>
            <h2><FontAwesomeIcon icon={faUserCog} /> Paramètres du compte</h2>
            
            <div className="form-group">
              <label htmlFor="adminName">Nom complet</label>
              <input 
                type="text" 
                id="adminName" 
                value={adminData.name}
                onChange={(e) => setAdminData({...adminData, name: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="adminEmail">Email</label>
              <input 
                type="email" 
                id="adminEmail" 
                value={adminData.email}
                onChange={(e) => setAdminData({...adminData, email: e.target.value})}
              />
            </div>
            
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={handleAdminUpdate}>
                <FontAwesomeIcon icon={faSave} /> Enregistrer les modifications
              </button>
              <button className="btn btn-secondary">
                <FontAwesomeIcon icon={faTimes} /> Annuler
              </button>
            </div>
          </div>

       
          <div id="securite" className={`tab-content ${activeTab === 'securite' ? 'active' : ''}`}>
            <h2><FontAwesomeIcon icon={faShieldAlt} /> Paramètres de sécurité</h2>
            
            <div className="form-group password-toggle">
              <label htmlFor="currentPassword">Mot de passe actuel</label>
              <input 
                type={passwordVisible.currentPassword ? "text" : "password"} 
                id="currentPassword" 
                value={securityData.currentPassword}
                onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
              />
              <button 
                className="password-toggle-btn" 
                onClick={() => togglePasswordVisibility('currentPassword')}
              >
                <FontAwesomeIcon icon={passwordVisible.currentPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            
            <div className="form-group password-toggle">
              <label htmlFor="newPassword">Nouveau mot de passe</label>
              <input 
                type={passwordVisible.newPassword ? "text" : "password"} 
                id="newPassword" 
                value={securityData.newPassword}
                onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
              />
              <button 
                className="password-toggle-btn" 
                onClick={() => togglePasswordVisibility('newPassword')}
              >
                <FontAwesomeIcon icon={passwordVisible.newPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            
            <div className="form-group password-toggle">
              <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
              <input 
                type={passwordVisible.confirmPassword ? "text" : "password"} 
                id="confirmPassword" 
                value={securityData.confirmPassword}
                onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
              />
              <button 
                className="password-toggle-btn" 
                onClick={() => togglePasswordVisibility('confirmPassword')}
              >
                <FontAwesomeIcon icon={passwordVisible.confirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={handlePasswordUpdate}>
                <FontAwesomeIcon icon={faLock} /> Mettre à jour la sécurité
              </button>
            </div>
          </div>

         
          <div id="systeme" className={`tab-content ${activeTab === 'systeme' ? 'active' : ''}`}>
            <h2><FontAwesomeIcon icon={faServer} /> Paramètres système</h2>
            
            <div className="form-group">
              <label htmlFor="systemName">Nom du système</label>
              <input 
                type="text" 
                id="systemName" 
                value={systemData.systemName}
                onChange={(e) => setSystemData({...systemData, systemName: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="sessionTimeout">Délai d'expiration de session (minutes)</label>
              <input 
                type="number" 
                id="sessionTimeout" 
                value={systemData.sessionTimeout}
                onChange={(e) => setSystemData({...systemData, sessionTimeout: e.target.value})}
                min="5" 
                max="1440" 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="maxLoginAttempts">Tentatives de connexion max</label>
              <input 
                type="number" 
                id="maxLoginAttempts" 
                value={systemData.maxLoginAttempts}
                onChange={(e) => setSystemData({...systemData, maxLoginAttempts: e.target.value})}
                min="1" 
                max="10" 
              />
            </div>
            
            <h3 style={{marginTop: '30px'}}>Informations système</h3>
            <div className="system-info">
              <div className="info-card">
                <div className="info-label">Dernière mise à jour</div>
                <div className="info-value">{systemData.lastUpdate}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Base de données</div>
                <div className="info-value">{systemData.database}</div>
              </div>
            </div>
            
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={handleSystemUpdate}>
                <FontAwesomeIcon icon={faServer} /> Appliquer les changements
              </button>
            </div>
          </div>

         
          
        </main>
      </div>
    </div>
  );
};

export default ParametresAdmin;