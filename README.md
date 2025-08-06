# GEC - Gestion Électronique des Courriers



## 📌 Description
**GEC** est une application web moderne pour la gestion électronique des courriers au sein de la CTAMA. Cette plateforme sécurisée permet la digitalisation complète du flux de traitement des courriers entrants et sortants.

## 🛠 Architecture Technique

### Backend
- **Framework**: Laravel 10 (API RESTful)
- **Authentification**: JWT (JSON Web Tokens)
- **Gestion des fichiers**: Système de stockage Laravel avec suivi des versions
- **Base de données**: MySQL 8.0+

### Frontend
- **Framework**: React.js 18
- **Bundler**: Vite
- **State Management**: Redux Toolkit
- **UI Components**: Material-UI ou Chakra UI *(à préciser)*

## ✨ Fonctionnalités Principales

### Workflow des Courriers
- Création, envoi et réception des courriers
- Traitement automatisé des flux entrants/sortants
- Attribution et transfert entre services

### Gestion des Utilisateurs
- Rôles hiérarchisés :
  - Administrateur système
  - Gestionnaire de service
  - Utilisateur standard
- Profils personnalisables

### Fonctionnalités Avancées
- Suivi en temps réel des statuts
- Notifications push pour les nouvelles actions
- Gestion des pièces jointes avec versionning
- Historique complet des actions (audit trail)
- Tableau de bord analytique
- Recherche full-text avec filtres multiples
