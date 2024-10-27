import { TitleBar, Modal, Button, ProgressBar as ProgressBarReact95 } from "@react95/core";
// @ts-ignore
import { Computer } from "@react95/icons";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

export type ProgressBarProps = {
    show: boolean;
    toggle: () => void;
};



type Progress = {
    progress: number,
    current_step: string,
}

export default function ProgressBar(props: ProgressBarProps) {
    const showProgress = props.show;
    const toggle = props.toggle;
    const [percentage, setPercentage] = useState(0);
    const [title, setTitle] = useState("");

    useEffect(() => {
        listen<Progress>("progress", (event) => {
            //console.log(payload);
            const stage = event.payload.current_step;
            const progress = event.payload.progress;
            setTitle(stage);
            setPercentage(progress);

        });
    }, []);




    if (!showProgress) return (<></>);

    return (
        <>
            <Modal
                title={`${title}...`}
                titleBarOptions={[
                    <TitleBar.Close key="close" onClick={toggle} />,
                ]}
            >
                <Modal.Content
                    width="400px"
                    height="100px"
                    bgColor="#c3c7cb"
                >
                    <div style={{ display: "flex", paddingTop: 24, justifyContent: "space-evenly", alignItems: "center", flexDirection: "row" }}>
                        <div>
                            <ProgressBarReact95 width="200px" percent={percentage} />
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
