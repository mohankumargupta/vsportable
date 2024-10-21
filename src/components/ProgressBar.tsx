
import styles from './XP.module.css';


export type ProgressBarProps = {
    show: boolean;
    toggle: (show: boolean) => void;
};

export default function ProgressBar(props: ProgressBarProps) {
    const showRecycleBin = props.show;
    const toggleShowRecycleBin = props.toggle;
    return (

        <div style={{ width: 300, marginLeft: 100 }} className={styles.window}>
            < div style={{ marginBottom: 20 }} className={styles["title-bar"]} >
                <div className={styles["title-bar-text"]}>Updating...</div>
                <div className={styles["title-bar-controls"]}>
                    <button aria-label="Minimize" />
                    <button aria-label="Maximize" />
                    <button aria-label="Close" />
                </div>
            </div >


            <div className={styles["window-body"]}>
                <p>
                    boomoo
                    <progress className={styles.progress} max="100" value="90"></progress>
                </p>
            </div>
        </div >
    );
};

