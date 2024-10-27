
import { Modal, Frame, TitleBar, List, Alert } from "@react95/core";
//@ts-ignore
import { RecycleFull, Shell322 } from "@react95/icons";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
//import { useWindowSize } from "./WindowSizeContext";
import { listen } from '@tauri-apps/api/event';

export type VSUpdateProps = {
    show: boolean;
    toggle: (show: boolean) => void;
    installs: String[]
};

type Progress = {
    progress: number,
    current_step: number,
}

export default function VSUpdate(props: VSUpdateProps) {
    const showVSUpdate: boolean = props.show;
    const toggleShowVSUpdate = props.toggle;
    const installs = props.installs;

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


    /*
    useEffect(() => {
        listen<Progress>("progress", (payload) => {
            console.log(payload);
        });
    }, []);
    */

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
                            invoke("vsupdate", { folder: selectedFolder });
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

            {showVSUpdate && (
                <Modal
                    className="resize"
                    key="recycleBin-modal"
                    width="600px"
                    height="450px"
                    icon={<RecycleFull variant="16x16_4" />}
                    title="VSUpdate"
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
                    menu={[
                        {
                            name: "File",
                            list: (
                                <List width="200px" className="dropdown-menu">
                                    <List.Item key="exit-item" onClick={handleCloseVSUpdate}>
                                        Exit
                                    </List.Item>
                                </List>
                            ),
                        },
                        {
                            name: "Edit",
                            list: (
                                <List width="200px" className="dropdown-menu">
                                    <List.Item key="copy-item">Copy</List.Item>
                                </List>
                            ),
                        },
                    ]}
                >
                    <Frame h="100%" w="100%">
                        <Frame w="100%" h="100%" bgColor="white" boxShadow="$in">
                            <div className="rc-flex-container">
                                <Frame
                                    h="20px"
                                    w="100%"
                                    bgColor="$material"
                                    boxShadow="$out"
                                    style={{ padding: "4px", minWidth: "180px" }}
                                >
                                    Name
                                </Frame>
                            </div>

                            {installs.map((val, index) => {
                                return (
                                    <div className="rc-list"
                                        key={index.toString()}
                                        onDoubleClick={() => {
                                            setSelectedFolder(val);
                                            handleCloseVSUpdate();

                                            toggleShowAlert(true);
                                            handleOpenVSUpdate();
                                        }}>
                                        <div className="rc-item">
                                            <Shell322 variant="16x16_4" className="rc-list-span" />
                                            <span className="rc-list-span">{val}</span>
                                        </div>
                                    </div>
                                );
                            }
                            )}


                        </Frame>
                    </Frame>
                </Modal>
            )}
        </>
    );
}