import { useEffect, useState } from "react";
//import reactLogo from "./assets/react.svg";
//import { invoke } from "@tauri-apps/api/core";
import "./App.css";

import TaskBar from "./components/Taskbar";
//import RecycleBin from "./components/RecycleBin";
import Desktop from "./components/Desktop";
import VSUpdate from "./components/VSUpdate";

import { invoke } from "@tauri-apps/api/core";
import VSInstall from "./components/VSInstall";
import ProgressBar from "./components/ProgressBar";
//import ProgressBar from "./components/ProgressBar";


/*
<ProgressBar
        show={showWindows.progress}
        toggle={() => toggleWindow("progress", !showWindows.progress)}
      />
*/


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
    vsupdate: false,
    vsinstall: false,
    progress: false,
  });

  const [vsupdateInstalls, setVsupdateInstalls] = useState<String[]>([""]);

  const toggleWindow = (windowName: string, isVisible: boolean) => {
    setShowWindows((prev) => ({
      ...prev,
      [windowName]: isVisible,
    }));
  };

  const handleOpenWindow = (windowName: string) => toggleWindow(windowName, true);

  useEffect(() => {
    const boo: Promise<String[]> = invoke("greet", { name: "From Javascript land." });
    boo.then((val) => {
      console.log(val);
      setVsupdateInstalls(val);
    });
  }, []);

  useEffect(() => {
    console.log(showWindows);
  }, [showWindows]);

  return (
    <>


      <Desktop
        openPaint={() => handleOpenWindow("paint")}
        openVSUpdate={() => handleOpenWindow("vsupdate")}
        openArts={() => handleOpenWindow("artsAndCrafts")}
        openResume={() => handleOpenWindow("resume")}
        openContact={() => handleOpenWindow("contact")}
        openCoding={() => handleOpenWindow("coding")}
        openRecycleBin={() => handleOpenWindow("progress")}
        openVSInstall={() => handleOpenWindow("vsinstall")}
      />

      <ProgressBar
        show={showWindows.progress}
        toggle={() => toggleWindow("progress", false)}
      />

      <VSUpdate
        show={showWindows.vsupdate}
        toggle={() => toggleWindow("vsupdate", !showWindows.vsupdate)}
        installs={vsupdateInstalls}
      />
      <VSInstall
        show={showWindows.vsinstall}
        toggle={() => toggleWindow("vsinstall", !showWindows.vsinstall)}
        toggleProgress={() => toggleWindow("progress", true)}
      />


      <TaskBar openCredit={() => { }} />
    </>
  );
}

export default App;
