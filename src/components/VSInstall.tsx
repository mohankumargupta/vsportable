
import { Modal, Frame, TitleBar, Alert, Input, Button } from "@react95/core";
//@ts-ignore
import { RecycleFull } from "@react95/icons";
import { invoke } from "@tauri-apps/api/core";
import { useRef, useState } from "react";
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
    const [selectedFolder, _setSelectedFolder] = useState<String | null>(null);
    //const [showVSUpdate, setShowVSUpdate] = useState(false);
    const confirmRef = useRef(null);

    //const windowSmall = useWindowSize();

    // Define the default position
    const screenW = window.innerWidth * 0.05; // Initial width 50% of screen
    const screenH = -30;
    const handleCloseVSUpdate = () => toggleShowVSUpdate(false);
    const handleOpenVSUpdate = () => toggleShowVSUpdate(true);

    const [inputValue, setInputValue] = useState('');

    // Handle the change event
    const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
        const inputElement = event.target as HTMLInputElement;
        setInputValue(inputElement.value);
    };


    return (



        <>
            {showAlert && (
                <Alert
                    message={`Are you sure you want to update ${selectedFolder}?`}
                    type="warning"
                    title="Update"
                    buttons={[{
                        value: "Ok", onClick: () => {
                            toggleShowAlert(false);
                            toggleProgress();
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
                            <label>Folder</label>
                            <label>{inputValue === "" ? "" : "vscode-"}{inputValue}</label>

                        </div>
                    </Frame>
                    <Frame>
                        <div>
                            <Button onClick={async () => {
                                const folder_exists: String | null = await invoke("folder_exists", { folder: `vscode-${inputValue}` });
                                if (folder_exists) {

                                }

                                else {
                                    await invoke("vsinstall", { folder: `vscode-${inputValue}` });

                                }


                            }}>OK</Button>
                            <Button>Cancel</Button>
                        </div>
                    </Frame>
                </Modal>
            )}
        </>
    );
}