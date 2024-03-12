import { useEffect, useState } from "react"
import { Checkbox } from "primereact/checkbox"
import { Divider } from "primereact/divider"
import { Dropdown } from "primereact/dropdown"
import { classNames } from "primereact/utils"
import { trpc } from '~/utils/trpc'
import { CalendarTheme } from "~/calendar";

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
      label: "Color Theme",
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
    <div className="grid">
      <div className="col-fixed" style={{ width: '250px' }}>
        <div className="row">
          <h1>Full Year Calendar Generator</h1>
        </div>
        <div className="field">
          <Dropdown value={theme} onChange={(e) => setTheme(e.value)} options={themes}/>
        </div>
        <div className="field">
          <Checkbox inputId="showGrid"
                    onChange={(e) => setShowGrid(e.checked ?? true)}
                    checked={showGrid ?? true}
          />
          <label htmlFor="showGrid">grid</label>
        </div>
        <div className="field">
          <Checkbox inputId="rotateMonthNames"
                    onChange={(e) => setRotateMonthNames(e.checked ?? true)}
                    checked={rotateMonthNames ?? true}
          />
          <label htmlFor="rotateMonthNames">rotate months</label>
        </div>
        <div className="field">

          <Checkbox inputId="showMoonPhases"
                    onChange={(e) => setShowMoonPhases(e.checked ?? false)}
                    checked={showMoonPhases ?? false}
          />
          <label htmlFor="showMoonPhases">moon phases</label>
        </div>
        <div className="field">

          <Checkbox inputId="showMoonIllunination"
                    onChange={(e) => setShowMoonIllunination(e.checked ?? false)}
                    checked={showMoonIllunination ?? false}
          />
          <label htmlFor="showMoonIllunination">moon illumination</label>
        </div>
        <div className="field">
          <Checkbox inputId="showDayNames"
                    onChange={(e) => setShowDayNames(e.checked ?? false)}
                    checked={showDayNames ?? false}
          />
          <label htmlFor="showDayNames">day names</label>
        </div>
        <div className="field">
          <Checkbox inputId="hideWeekendDayNames"
                    onChange={(e) => setHideWeekendDayNames(e.checked ?? false)}
                    checked={hideWeekendDayNames ?? false}
          />
          <label htmlFor="hideWeekendDayNames" className="ml-2">hide weekend names</label>
        </div>
        <Divider/>
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
      </div>
      <div className="col">
        <div className="mainContent flex align-items-center justify-content-center cal-svg-container">
        <div dangerouslySetInnerHTML={{ __html: svg }}/>
          <div className={classNames({ "cal-hidden": !svgIsArriving, "cal-fade-in": svgIsArriving })}
               dangerouslySetInnerHTML={{ __html: arrivingSvg }}/>
        </div>
      </div>
    </div>
  )

}

export default Calendar
