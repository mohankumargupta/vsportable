
import { Modal, Frame, TitleBar, List } from "@react95/core";
import { RecycleFull, Shell322, Wangimg129 } from "@react95/icons";
//import { useWindowSize } from "./WindowSizeContext";

export type RecycleBinProps = {
    show: boolean;
    toggle: (show: boolean) => void;
};

export default function RecycleBin(props: RecycleBinProps) {
    const showRecycleBin = props.show;
    const toggleShowRecycleBin = props.toggle;

    //const windowSmall = useWindowSize();

    // Define the default position
    const screenW = window.innerWidth * 0.05; // Initial width 50% of screen
    const screenH = -30;
    const handleCloseRecycleBin = () => toggleShowRecycleBin(false);
    return (
        <>
            {showRecycleBin && (
                <Modal
                    className="resize"
                    key="recycleBin-modal"
                    width="600px"
                    height="450px"
                    icon={<RecycleFull variant="16x16_4" />}
                    title="Recycle Bin"
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
                        <TitleBar.Close key="close" onClick={handleCloseRecycleBin} />,
                    ]}
                    menu={[
                        {
                            name: "File",
                            list: (
                                <List width="200px" className="dropdown-menu">
                                    <List.Item key="exit-item" onClick={handleCloseRecycleBin}>
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
                            <div className="rc-list">
                                <div className="rc-item">
                                    <Shell322 variant="16x16_4" className="rc-list-span" />
                                    <span className="rc-list-span">Resume-copy</span>
                                </div>
                            </div>
                        </Frame>
                    </Frame>
                </Modal>
            )}
        </>
    );
}