import { useState, useCallback, useEffect } from "react";
import { postCommand } from "./postCommand";

export function useCanvasSyncSettings(url, courseId, enabled) {
    const [settings, setSettings] = useState(null);

    const refresh = useCallback(() => {
        if (!courseId) return Promise.resolve(null);
        return postCommand(url, {
            asciCourseId: courseId,
            command: "getCanvasLmsSyncSettings",
        })
            .then((data) => {
                if (data.success === "true") {
                    setSettings(data.settings);
                    return data.settings;
                }
                return null;
            })
            .catch((error) => {
                console.log(error);
                return null;
            });
    }, [url, courseId]);

    const save = useCallback(
        (autosyncEnabled, stalePeriod) =>
            postCommand(url, {
                asciCourseId: courseId,
                autosyncEnabled,
                stalePeriod,
                command: "setCanvasLmsSyncSettings",
            }).then((data) => {
                if (data.success === "true") {
                    setSettings(data.settings);
                }
                return data;
            }),
        [url, courseId]
    );

    useEffect(() => {
        if (enabled) {
            refresh();
        } else {
            setSettings(null);
        }
    }, [enabled, refresh]);

    return { settings, setSettings, refresh, save };
}
