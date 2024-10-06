import { useEffect, useState } from "react";
//import reactLogo from "./assets/react.svg";
//import { invoke } from "@tauri-apps/api/core";
import "./App.css";

import TaskBar from "./components/Taskbar";
import RecycleBin from "./components/RecycleBin";
import Desktop from "./components/Desktop";
import { invoke } from "@tauri-apps/api/core";
 


function App() {

  const [showWindows, setShowWindows] = useState({
    paint: false,
    streaming: false,
    artsAndCrafts: false,
    resume: false,
    contact: false,
    coding: false,
    recycleBin: false,
    credit: false,
    help: false,
  });

  const toggleWindow = (windowName: string, isVisible: boolean) => {
    setShowWindows((prev) => ({
      ...prev,
      [windowName]: isVisible,
    }));
  };

  const handleOpenWindow = (windowName: string) => toggleWindow(windowName, true);

  useEffect(()=>{
    const boo = invoke("greet", {name: "From Javascript land."});
    boo.then((val)=>console.log(val));
  },[]);

  return (
    <>
      <Desktop
        openPaint={() => handleOpenWindow("paint")}
        openStreaming={() => handleOpenWindow("streaming")}
        openArts={() => handleOpenWindow("artsAndCrafts")}
        openResume={() => handleOpenWindow("resume")}
        openContact={() => handleOpenWindow("contact")}
        openCoding={() => handleOpenWindow("coding")}
        openRecycleBin={() => handleOpenWindow("recycleBin")}
      />
      <RecycleBin
        show={showWindows.recycleBin}
        toggle={() => toggleWindow("recycleBin", !showWindows.recycleBin)}
      />
      <TaskBar openCredit={() => { }} />
    </>
  );
}

export default App;
