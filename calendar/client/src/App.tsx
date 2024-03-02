import { PrimeReactProvider } from "primereact/api"

import "primeflex/primeflex.css"
import "primereact/resources/themes/lara-light-cyan/theme.css"
import "primeicons/primeicons.css"


import "./App.css"
import Calendar from "./Calendar"

function App() {

    return (
        <PrimeReactProvider>
            <Calendar />
        </PrimeReactProvider>
    )
}

export default App
