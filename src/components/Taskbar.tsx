import { TaskBar as React95TaskBar, List } from "@react95/core";
import {
    Computer3,
    MsDos,
    Awfxcg321303,
} from "@react95/icons";
import { PropsWithoutRef } from "react";

type TaskBarProps = {
    openCredit: () => void;
};

function TaskBar(props: PropsWithoutRef<TaskBarProps>) {
    const { openCredit } = props;

    return (
        <>
            <React95TaskBar
                list={
                    <List>
                        <List.Item
                            icon={
                                <img
                                    src="./github-logo.png"
                                    alt="Github"
                                    style={{
                                        width: "32px",
                                        marginRight: "10px",
                                    }}
                                />
                            }
                            onClick={() => window.open("https://github.com/mohankumargupta/vsportable", "_blank")}
                        >
                            Source Code
                        </List.Item>
                        <List.Item icon={<Awfxcg321303 variant="32x32_4" />} onClick={openCredit}>
                            Credit
                        </List.Item>
                        <List.Item icon={<MsDos variant="32x32_32" />}>
                            MS-DOS Prompt
                        </List.Item>
                        <List.Divider />
                        <List.Item icon={<Computer3 variant="32x32_4" />}>
                            Shut Down...
                        </List.Item>
                    </List>
                }
            />

        </>
    );
}

export default TaskBar;