
import { Modal, Frame, TitleBar, Alert, Input, Button } from "@react95/core";
//@ts-ignore
import { RecycleFull } from "@react95/icons";
import { invoke } from "@tauri-apps/api/core";
//import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { downloadDir } from "@tauri-apps/api/path";
import { open } from '@tauri-apps/plugin-dialog';
import { useEffect, useRef, useState } from "react";
//import { useWindowSize } from "./WindowSizeContext";

export type VSInstallProps = {
    show: boolean;
    toggle: (show: boolean) => void;
    toggleProgress: () => void;
    //installs: String[]
};

export default function VSInstall(props: VSInstallProps) {
    const showVSInstall: boolean = props.show;
    const toggleShowVSUpdate = props.toggle;
    const toggleProgress = props.toggleProgress;
    //const installs = props.installs;

    const [showAlert, toggleShowAlert] = useState(false);
    //const [selectedFolder, setSelectedFolder] = useState<String | null>(null);
    //const [showVSUpdate, setShowVSUpdate] = useState(false);
    const confirmRef = useRef(null);

    //const windowSmall = useWindowSize();

    // Define the default position
    const screenW = window.innerWidth * 0.05; // Initial width 50% of screen
    const screenH = -30;
    const handleCloseVSUpdate = () => toggleShowVSUpdate(false);
    const handleOpenVSUpdate = () => toggleShowVSUpdate(true);

    const [inputValue, setInputValue] = useState('');
    const [prefix, setPrefix] = useState("");
    const [location, setLocation] = useState("")
    // Handle the change event
    const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
        const inputElement = event.target as HTMLInputElement;
        setInputValue(inputElement.value);
    };


    const handleChangePrefix = (event: React.FormEvent<HTMLInputElement>) => {
        const inputElement = event.target as HTMLInputElement;
        setPrefix(inputElement.value);
    };

    async function resolveDir() {
        const homedirpath = await downloadDir();
        setLocation(homedirpath);
    }

    async function openDialog() {
        const folder = await open({
            multiple: false,
            directory: true,
        });
        console.log(folder);
        if (folder) {
            setLocation(folder);
        }

    }

    useEffect(() => {
        setPrefix("vscode");
        resolveDir();
    }, []);

    async function _vsinstall() {
        const newfolder = `${prefix}-${inputValue}`;
        const folder_exists: String | null = await invoke("folder_exists", { folder: newfolder, location: location });
        if (folder_exists) {
            console.log(`folder ${newfolder} already exists`);

        }

        else {
            toggleProgress();
            await invoke("vsinstall", { folder: `${prefix}-${inputValue}`, location: location });

        }
    }

    return (



        <>
            {showAlert && (
                <Alert
                    message={`Are you sure you want to install vscode-${inputValue}?`}
                    type="warning"
                    title="Update"
                    buttons={[{
                        value: "Ok", onClick: () => {

                            toggleShowAlert(false);
                            _vsinstall();
                        }
                    }, {
                        value: "Cancel", onClick: () => {
                            toggleShowAlert(false);
                            handleOpenVSUpdate();
                        }
                    }]}
                    buttonsAlignment={'center'}
                    ref={confirmRef}
                />
            )}

            {showVSInstall && (
                <Modal
                    className="resize"
                    key="recycleBin-modal"
                    width="600px"
                    height="450px"
                    icon={<RecycleFull variant="16x16_4" />}
                    title="VSInstall"
                    dragOptions={{
                        defaultPosition: {
                            x: screenW,
                            y: screenH,
                        },
                    }}
                    titleBarOptions={[
                        <TitleBar.Help
                            key="help"
                            onClick={() => {
                                alert("Help!");
                            }}
                        />,
                        <TitleBar.Close key="close" onClick={handleCloseVSUpdate} />,
                    ]}
                >
                    <Frame>
                        <div className="form">
                            <label>Name</label>
                            <Input onChange={handleChange} />
                        </div>
                        <div className="form">
                            <label>Prefix</label>
                            <Input onChange={handleChangePrefix} value={prefix} />
                        </div>
                        <div className="form">
                            <label>Folder</label>
                            <label>{prefix === "" ? "" : `${prefix}-`}{inputValue}</label>

                        </div>
                        <div className="form">
                            <label>Location</label>
                            <label>{location}</label>
                            <Button onClick={async () => {
                                await openDialog();
                            }}>Change</Button>

                        </div>
                    </Frame>
                    <Frame>
                        <div>
                            <Button onClick={() => {
                                toggleShowAlert(true)
                                toggleShowVSUpdate(false);
                            }}>OK</Button>
                            <Button>Cancel</Button>
                        </div>
                    </Frame>
                </Modal>
            )}
        </>
    );
}