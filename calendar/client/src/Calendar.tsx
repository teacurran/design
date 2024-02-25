import React, {useEffect, useState} from 'react';
import {Splitter, SplitterPanel} from 'primereact/splitter';
import {Accordion, AccordionTab} from 'primereact/accordion';
import {Checkbox} from 'primereact/checkbox';
import {Button} from "primereact/button";
import {Divider} from "primereact/divider";

function Calendar() {
  const [url, setUrl] = useState('')
  const [queryString, setQueryString] = useState('')
  const [svg, setSvg] = useState('')

  const [showMoonPhases, setShowMoonPhases] = useState<boolean>(false)
  const [showGrid, setShowGrid] = useState<boolean>(true)


  useEffect(() => {
    let url = 'http://localhost:3400/calendar'

    let queryString = ''
    queryString += `?showMoonPhases=${showMoonPhases}`
    queryString += `&showGrid=${showGrid}`

    setQueryString(queryString)
    setUrl(`${url}${queryString}`)

  }, [showMoonPhases, showGrid]);

  useEffect(() => {
    fetch(url)
      .then((response) => response.text())
      .then((data) => {
        setSvg(data);
      })
      .catch((error) => {
        console.error('Error fetching SVG:', error);
      });
  }, [url]);

  const downloadPdf = () => {
    window.location.href = `${url}&format=pdf`
  }

  return (
    <div className="calendar-frame">
      <Splitter style={{height: '100%'}}>
        <SplitterPanel className="leftMenu flex align-items-top justify-content-left" size={10}>
          <Accordion activeIndex={0} multiple={true}>
            <AccordionTab header="options">
              <div>
                <Checkbox inputId="showGrid"
                          onChange={(e) => setShowGrid(e.checked ?? true)}
                          checked={showGrid ?? true}
                />
                <label htmlFor="showGrid" className="ml-2">Show Grid</label>
              </div>

              <div><Checkbox inputId="showMoonPhases"
                             onChange={(e) => setShowMoonPhases(e.checked ?? false)}
                             checked={showMoonPhases ?? false}
              />
                <label htmlFor="showMoonPhases" className="ml-2">Show moon phases</label>
              </div>
            </AccordionTab>
            <AccordionTab header="export">
              <Button label="download PNG" icon="pi pi-image"/>
              <Divider/>
              <a href={`${url}&format=pdf`} download="calendar.pdf" target="_blank">download PDF</a>
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
