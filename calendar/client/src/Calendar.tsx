import { useEffect, useState } from "react"
import { Checkbox } from "primereact/checkbox"
import { Divider } from "primereact/divider"
import { Dropdown } from "primereact/dropdown"
import { API_URL } from "./constants"
import { classNames } from "primereact/utils"

function Calendar() {
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

  type CalendarTheme = "" | "vermontWeekends" | "rainbowWeekends" | "rainbowDays1" | "rainbowDays2" | "rainbowDays3"

  useEffect(() => {
    getCalendar().then((response) => response.text())
      .then((data) => {
        setArrivingSvg(data)
        setSvgIsArriving(true)

        setTimeout(() => {
          setSvg(data)
          setSvgIsArriving(false)
        }, 500)
      })
      .catch((error) => {
        console.error("Error fetching SVG:", error)
      })

  }, [showMoonPhases, showMoonIllunination, showGrid, showDayNames, hideWeekendDayNames, theme, rotateMonthNames])

  const getCalendarParameters = (): {
    optShowMoonPhase: boolean
    optShowMoonIllumination: boolean
    optShowGrid: boolean
    optShowDayNames: boolean
    rotateMonthNames: boolean
    hideWeekendDayNames: boolean
    theme: string
  } => {
    return {
      optShowMoonPhase: showMoonPhases,
      optShowMoonIllumination: showMoonIllunination,
      optShowGrid: showGrid,
      optShowDayNames: showDayNames,
      rotateMonthNames,
      hideWeekendDayNames,
      theme: theme as CalendarTheme
    }
  }

  const getCalendar = (): Promise<Response> => {
    const url = API_URL + "/calendar"
    const getCalendarBody = JSON.stringify(getCalendarParameters())
    // send a POST request to /api/calendar/export/pdf with the current state
    return fetch(`${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: getCalendarBody
    })
  }

  const downloadPdf = (): void => {
    downloadFile("pdf")
  }

  const downloadPng = (): void => {
    downloadFile("png")
  }

  const downloadFile = (format: string): void => {
    const url = API_URL + "/calendar"
    // send a POST request to /api/calendar/export/pdf with the current state
    fetch(`${url}/api/calendar/export?format=${format}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(getCalendarParameters)
    })
      .then(async response => await response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(new Blob([blob]))
        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", `calendar.${format}`)
        document.body.appendChild(link)
        link.click()
        link.parentNode?.removeChild(link)
      }).catch(error => {
      console.error("Error fetching SVG:", error)
    })
  }



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
    <div className="grid">
      <div className="col-fixed" style={{ width: "250px" }}>
        <div className="row">
          <h1>Full Year Calendar Generator</h1>
        </div>
        <div className="field">
          <Dropdown value={theme} onChange={(e) => {
            setTheme(e.value as string)
          }} options={themes}/>
        </div>
        <div className="field">
          <Checkbox inputId="showGrid"
                    onChange={(e) => {
                      setShowGrid(e.checked ?? true)
                    }}
                    checked={showGrid ?? true}
          />
          <label htmlFor="showGrid">grid</label>
        </div>
        <div className="field">
          <Checkbox inputId="rotateMonthNames"
                    onChange={(e) => {
                      setRotateMonthNames(e.checked ?? true)
                    }}
                    checked={rotateMonthNames ?? true}
          />
          <label htmlFor="rotateMonthNames">rotate months</label>
        </div>
        <div className="field">

          <Checkbox inputId="showMoonPhases"
                    onChange={(e) => {
                      setShowMoonPhases(e.checked ?? false)
                    }}
                    checked={showMoonPhases ?? false}
          />
          <label htmlFor="showMoonPhases">moon phases</label>
        </div>
        <div className="field">

          <Checkbox inputId="showMoonIllunination"
                    onChange={(e) => {
                      setShowMoonIllunination(e.checked ?? false)
                    }}
                    checked={showMoonIllunination ?? false}
          />
          <label htmlFor="showMoonIllunination">moon illumination</label>
        </div>
        <div className="field">
          <Checkbox inputId="showDayNames"
                    onChange={(e) => {
                      setShowDayNames(e.checked ?? false)
                    }}
                    checked={showDayNames ?? false}
          />
          <label htmlFor="showDayNames">day names</label>
        </div>
        <div className="field">
          <Checkbox inputId="hideWeekendDayNames"
                    onChange={(e) => {
                      setHideWeekendDayNames(e.checked ?? false)
                    }}
                    checked={hideWeekendDayNames ?? false}
          />
          <label htmlFor="hideWeekendDayNames" className="ml-2">hide weekend names</label>
        </div>
        <Divider/>
        <a className="p-button font-bold" onClick={downloadPng}>
          <span className="pi pi-image"></span>{""}
          &nbsp;&nbsp;PNG&nbsp;&nbsp;
          <span className="pi pi-download"></span>
        </a>
        <Divider/>
        <a className="p-button font-bold" onClick={downloadPdf}>
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
