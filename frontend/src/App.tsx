import {BrowserRouter, Route, Routes} from "react-router-dom"
import Landing from "./components/Landing"
import Room from "./components/Room"

export default function App(){

  return <div>
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing/>}></Route>
            <Route path="/room" element={<Room/>}></Route>
            <Route></Route>
          </Routes>
      </BrowserRouter>
  </div>
}