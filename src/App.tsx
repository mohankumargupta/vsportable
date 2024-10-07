import { useEffect, useState } from "react";
//import reactLogo from "./assets/react.svg";
//import { invoke } from "@tauri-apps/api/core";
import "./App.css";

import TaskBar from "./components/Taskbar";
import RecycleBin from "./components/RecycleBin";
import Desktop from "./components/Desktop";
import VSUpdate from "./components/VSUpdate";

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
    vsupdate: true,
  });

  const toggleWindow = (windowName: string, isVisible: boolean) => {
    setShowWindows((prev) => ({
      ...prev,
      [windowName]: isVisible,
    }));
  };

  const handleOpenWindow = (windowName: string) => toggleWindow(windowName, true);

  useEffect(() => {
    const boo = invoke("greet", { name: "From Javascript land." });
    boo.then((val) => console.log(val));
  }, []);

  return (
    <>
      <Desktop
        openPaint={() => handleOpenWindow("paint")}
        openVSUpdate={() => handleOpenWindow("vsupdate")}
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
      <VSUpdate
        show={showWindows.vsupdate}
        toggle={() => toggleWindow("vsupdate", !showWindows.vsupdate)}
      />


      <TaskBar openCredit={() => { }} />
    </>
  );
}

export default App;
