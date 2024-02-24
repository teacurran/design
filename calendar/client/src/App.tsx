import React, { useState, useEffect } from 'react';

import logo from './logo.svg';
import './App.css';

function App() {
    const [svg, setSvg] = useState('');

    useEffect(() => {
        fetch('http://localhost:3400/calendar')
            .then((response) => response.text())
            .then((data) => {
                setSvg(data);
            })
            .catch((error) => {
                console.error('Error fetching SVG:', error);
            });
    }, []);

  return (
    <div className="App">
        <div dangerouslySetInnerHTML={{__html: svg}}/>
    </div>
  );
}

export default App;
