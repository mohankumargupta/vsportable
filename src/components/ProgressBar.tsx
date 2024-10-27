import { TitleBar, Modal, Button, ProgressBar as ProgressBarReact95 } from "@react95/core";
// @ts-ignore
import { Computer } from "@react95/icons";



export default function ProgressBar() {
    function handleCloseModal(_event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
        throw new Error("Function not implemented.");
    }

    return (
        <>
            <Modal
                title="Downloading..."
                titleBarOptions={[
                    <TitleBar.Close key="close" onClick={handleCloseModal} />,
                ]}
            >
                <Modal.Content
                    width="400px"
                    height="100px"
                    bgColor="#c3c7cb"
                >
                    <div style={{ display: "flex", paddingTop: 24, justifyContent: "space-evenly", alignItems: "center", flexDirection: "row" }}>
                        <div>
                            <ProgressBarReact95 width="200px" percent={49} />
                        </div>
                        <div>
                            <Button>Cancel</Button>
                        </div>
                    </div>

                </Modal.Content>
            </Modal>
        </>
    );
}
