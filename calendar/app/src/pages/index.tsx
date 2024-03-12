import { useEffect, useState } from "react"
import { Splitter, SplitterPanel } from "primereact/splitter"
import { Accordion, AccordionTab } from "primereact/accordion"
import { Checkbox } from "primereact/checkbox"
import { Divider } from "primereact/divider"
import { Dropdown } from "primereact/dropdown"
import { classNames } from "primereact/utils"
import { trpc } from '~/utils/trpc'
import { CalendarTheme } from "~/calendar";
import { Sidebar } from "primereact/sidebar";

function Calendar() {
  const [url] = useState("")
  const [svg, setSvg] = useState("")
  const [arrivingSvg, setArrivingSvg] = useState("")
  const [svgIsArriving, setSvgIsArriving] = useState(false)

  const [showMoonPhases, setShowMoonPhases] = useState<boolean>(false)
  const [showMoonIllunination, setShowMoonIllunination] = useState<boolean>(false)
  const [showGrid, setShowGrid] = useState<boolean>(true)
  const [showDayNames, setShowDayNames] = useState<boolean>(false)
  const [hideWeekendDayNames, setHideWeekendDayNames] = useState<boolean>(false)
  const [theme, setTheme] = useState("")
  const [rotateMonthNames, setRotateMonthNames] = useState<boolean>(true)
  const [optimize, setOptimize] = useState<boolean>(false)

  const generateCalendarMutation = trpc.calendar.generate.useMutation({
    onSuccess: (data) => {
      setArrivingSvg(data)
      setSvgIsArriving(true)

      setTimeout(() => {
        setSvg(data)
        setSvgIsArriving(false)
      }, 500)
    },
    onError: (error) => {
      console.error("Error fetching SVG:", error)
    }
  })

  useEffect(() => {
    generateCalendarMutation.mutate({
      optShowMoonPhase: showMoonPhases,
      optShowMoonIllumination: showMoonIllunination,
      optShowGrid: showGrid,
      optShowDayNames: showDayNames,
      rotateMonthNames,
      hideWeekendDayNames,
      theme: theme as CalendarTheme
    })
  }, [showMoonPhases, showMoonIllunination, showGrid, showDayNames, hideWeekendDayNames, theme, rotateMonthNames, optimize])

  const themes = [
    {
      label: "None",
      value: ""
    },
    {
      label: "Vermont Weekends",
      value: "vermontWeekends"
    },
    {
      label: "Rainbow Weekends",
      value: "rainbowWeekends"
    },
    {
      label: "Rainbow Days 1",
      value: "rainbowDays1"
    },
    {
      label: "Rainbow Days 2",
      value: "rainbowDays2"
    },
    {
      label: "Rainbow Days 3",
      value: "rainbowDays3"
    }
  ]

  return (
    <>
      <Sidebar onHide={() => {}} visible={true} position="left" style={{ width: "400px" }}>
        <div className="p-d-flex p-flex-column p-ai-center">
          <h1>Calendar</h1>
          <p>Generate a calendar</p>
        </div>
        <Accordion activeIndex={0} multiple={true}>
          <AccordionTab header="options">
            <ul>
              <li>
                <Checkbox inputId="showGrid"
                          onChange={(e) => setShowGrid(e.checked ?? true)}
                          checked={showGrid ?? true}
                />
                <label htmlFor="showGrid" className="ml-2">show grid</label>
              </li>

              <li>
                <Checkbox inputId="rotateMonthNames"
                          onChange={(e) => setRotateMonthNames(e.checked ?? true)}
                          checked={rotateMonthNames ?? true}
                />
                <label htmlFor="rotateMonthNames" className="ml-2">rotate month names</label>
              </li>

              <li><Checkbox inputId="showMoonPhases"
                            onChange={(e) => setShowMoonPhases(e.checked ?? false)}
                            checked={showMoonPhases ?? false}
              />
                <label htmlFor="showMoonPhases" className="ml-2">show moon phases</label>
              </li>

              <li><Checkbox inputId="showMoonIllunination"
                            onChange={(e) => setShowMoonIllunination(e.checked ?? false)}
                            checked={showMoonIllunination ?? false}
              />
                <label htmlFor="showMoonIllunination" className="ml-2">show moon illumination</label>
              </li>

              <li><Checkbox inputId="showDayNames"
                            onChange={(e) => setShowDayNames(e.checked ?? false)}
                            checked={showDayNames ?? false}
              />
                <label htmlFor="showDayNames" className="ml-2">show day names</label>
              </li>

              <li><Checkbox inputId="hideWeekendDayNames"
                            onChange={(e) => setHideWeekendDayNames(e.checked ?? false)}
                            checked={hideWeekendDayNames ?? false}
              />
                <label htmlFor="hideWeekendDayNames" className="ml-2">hide weekend names</label>
              </li>

              <li><Checkbox inputId="optimize"
                            onChange={(e) => setOptimize(e.checked ?? true)}
                            checked={optimize ?? true}
              />
                <label htmlFor="optimize" className="ml-2">optimize SVG</label>
              </li>

              <li>
                <Dropdown value={theme} onChange={(e) => setTheme(e.value)} options={themes}>
                  <option value="vermontWeekends">Vermont Weekends</option>
                </Dropdown>
              </li>

            </ul>
          </AccordionTab>
          <AccordionTab header="export">
            <a href={`${url}&format=png`} download="calendar.pdf" className="p-button font-bold">
              <span className="pi pi-image"></span>{""}
              &nbsp;&nbsp;PNG&nbsp;&nbsp;
              <span className="pi pi-download"></span>
            </a>
            <Divider/>
            <a href={`${url}&format=pdf`} download="calendar.pdf" className="p-button font-bold">
              <span className="pi pi-file-pdf"></span>{""}
              &nbsp;&nbsp;PDF&nbsp;&nbsp;
              <span className="pi pi-download"></span>
            </a>
          </AccordionTab>
        </Accordion>
      </Sidebar>

      <div className="mainContent flex align-items-center justify-content-center cal-svg-container">
        <div dangerouslySetInnerHTML={{ __html: svg }}/>
        <div className={classNames({ "cal-hidden": !svgIsArriving, "cal-fade-in": svgIsArriving })}
                dangerouslySetInnerHTML={{ __html: arrivingSvg }}/>
      </div>
    </>
  )

}

export default Calendar
