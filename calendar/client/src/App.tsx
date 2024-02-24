import React from 'react';
import { PrimeReactProvider, PrimeReactContext } from 'primereact/api';

import "primereact/resources/themes/lara-light-cyan/theme.css";


import './App.css';
import Calendar from "./Calendar";

function App() {

  return (
      <PrimeReactProvider>
        <Calendar />
      </PrimeReactProvider>
  );
}

export default App;
