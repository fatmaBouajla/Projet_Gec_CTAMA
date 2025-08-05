import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './views/signup';
import Login from './views/login';
import ForgotPassword from './views/forgotpassword';
import Codepassword from './views/codepassword';
import CompteUtilisateur from './views/compteutilisateur';
import Compteadmin from './views/compteadmin';
import Recugestionnaire from './views/recugestionnaire';
import Gestionservice from './views/gestionservice';
import Comptegestionnaire from './views/comptegestionnaire';
import Ajoutercourrier from './views/ajoutercourrier';
import Parametresadmin from './views/parametresadmin';
import Envoyercourrier from './views/envoyercourrier';
import Parametres from './views/parametres';

import Nouveaupassword from './views/nouveaupassword';
import Courrierenvoye from './views/courrierenvoye';
import Courrierenvoyegest from './views/courrierenvoyegest';
import Brouillongest   from './views/brouillongest';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/codepassword" element={<Codepassword />} />
        <Route path="/compteutilisateur" element={<CompteUtilisateur />} />
        <Route path="/compteadmin" element={<Compteadmin />} />
          <Route path="/recugestionnaire " element={<  Recugestionnaire/>} />
        <Route path="/gestionservice" element={<Gestionservice />} />
        <Route path="/comptegestionnaire" element={<Comptegestionnaire />} />
        <Route path="/ajoutercourrier" element={<Ajoutercourrier />} />
        <Route path="/parametresadmin" element={<Parametresadmin/>} />
        <Route path="/envoyercourrier" element={<Envoyercourrier/>} />
         <Route path="/parametres" element={<Parametres/>} />
        
         <Route path="/nouveaupassword" element={<  Nouveaupassword/>} />
        <Route path="/courrierenvoye" element={<Courrierenvoye/>} />
      <Route path="/courrierenvoyegest" element={<Courrierenvoyegest />} />
       <Route path="/brouillongest" element={<Brouillongest />} />
      
         
       
      </Routes>
    </Router>
  );
}

export default App;