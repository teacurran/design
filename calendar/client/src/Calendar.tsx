import React, { useState, useEffect } from 'react';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Checkbox } from 'primereact/checkbox';

function Calendar() {
    const [svg, setSvg] = useState('');

    const [showMoonPhases, setShowMoonPhases] = useState<boolean|undefined>(false);

    useEffect(() => {
        fetch(`http://localhost:3400/calendar?showMoonPhases=${showMoonPhases}`)
            .then((response) => response.text())
            .then((data) => {
                setSvg(data);
            })
            .catch((error) => {
                console.error('Error fetching SVG:', error);
            });
    }, [showMoonPhases]);

    return (
        <div className="calendar-frame">
            <Splitter style={{height: '100%'}}>
                <SplitterPanel className="leftMenu flex align-items-top justify-content-left" size={10}>
                    <Accordion activeIndex={0}>
                        <AccordionTab header="options">
                            <Checkbox inputId="showMoonPhases"
                                      onChange={(e) => setShowMoonPhases(e.checked)}
                                      checked={showMoonPhases ?? false}
                            />
                            <label htmlFor="showMoonPhases" className="ml-2">Show moon phases</label>
                        </AccordionTab>
                    </Accordion>

                </SplitterPanel>
                <SplitterPanel className="mainContent flex align-items-center justify-content-center">
                    <div dangerouslySetInnerHTML={{__html: svg}}/>
                </SplitterPanel>
            </Splitter>
        </div>
)
    ;
}

export default Calendar;
