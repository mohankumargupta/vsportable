
import { Modal, Frame, TitleBar, List, Alert, Input } from "@react95/core";
import { RecycleFull, Shell322 } from "@react95/icons";
import { useRef, useState } from "react";
//import { useWindowSize } from "./WindowSizeContext";

export type VSInstallProps = {
    show: boolean;
    toggle: (show: boolean) => void;
    //installs: String[]
};

export default function VSInstall(props: VSInstallProps) {
    const showVSInstall: boolean = props.show;
    const toggleShowVSUpdate = props.toggle;
    //const installs = props.installs;

    const [showAlert, toggleShowAlert] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<String | null>(null);
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
    const handleChange = (event) => {
        setInputValue(event.target.value);
    };


    return (



        <>
            {showAlert && (
                <Alert
                    message={`Are you sure you want to update ${selectedFolder}?`}
                    type="warning"
                    title="Update"
                    buttons={[{ value: "Ok", onClick: () => { toggleShowAlert(false); } }, {
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
                </Modal>
            )}
        </>
    );
}