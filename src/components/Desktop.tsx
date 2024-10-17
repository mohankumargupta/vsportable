import { useState } from "react";
//@ts-ignore
import { MsawtAwtIcon, Explorer108, Wordpad, Awfxcg321304, Progman10 } from "@react95/icons";
import { invoke } from "@tauri-apps/api/core";

export type DesktopProps = {
    openPaint: () => void;
    openVSUpdate: () => void;
    openVSInstall: () => void;
    openArts: () => void;
    openCoding: () => void;
    openRecycleBin: () => void;
    openResume: () => void;
    openContact: () => void;
};

export default function Desktop(props: DesktopProps) {
    const [activeIcon, setActiveIcon] = useState<number | null>(null);
    const handleOpenRecycleBin = props.openRecycleBin;
    const handleOpenVSupdate = props.openVSUpdate;
    const handleOpenVSInstall = props.openVSInstall;

    const handleToggleIcon = (iconId: number | null) => {
        setActiveIcon((prev) => (prev === iconId ? null : iconId));
    };

    return (
        <div className="desktop-icons">
            <div
                className={activeIcon === 1 ? "active-icon" : "inactive-icon"}
                onClick={() => handleToggleIcon(1)}
                onDoubleClick={handleOpenRecycleBin}
            >
                <Explorer108 variant="32x32_4" />
                <p>Recycle Bin</p>
            </div>
            <div
                className={activeIcon === 3 ? "active-icon" : "inactive-icon"}
                onClick={() => handleToggleIcon(3)}
                onDoubleClick={handleOpenVSInstall}
            >
                <MsawtAwtIcon variant="32x32_4" />
                <p>VSPortable Install</p>
            </div>
            <div
                className={activeIcon === 6 ? "active-icon" : "inactive-icon"}
                onClick={() => handleToggleIcon(6)}
                onDoubleClick={handleOpenVSupdate}
            >
                <Wordpad variant="32x32_4" />
                <p>VSPortable Update</p>
            </div>
            <div
                className={activeIcon === 7 ? "active-icon" : "inactive-icon"}
                onClick={() => handleToggleIcon(7)}
                onDoubleClick={async () => {
                    await invoke("launch_vsportable");

                }}
            >
                <Progman10 variant="32x32_4" />
                <p>Launch VSCode</p>
            </div>
        </div>
    );
}