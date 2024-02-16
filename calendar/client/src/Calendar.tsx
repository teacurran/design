import React, { useState, useEffect } from 'react';

function Calendar() {
    const [svg, setSvg] = useState('');

    useEffect(() => {
        fetch('/generate-svg')
            .then((response) => response.text())
            .then((data) => {
                setSvg(data);
            })
            .catch((error) => {
                console.error('Error fetching SVG:', error);
            });
    }, []);

    return (
        <div dangerouslySetInnerHTML={{ __html: svg }} />
    );
}

export default Calendar;