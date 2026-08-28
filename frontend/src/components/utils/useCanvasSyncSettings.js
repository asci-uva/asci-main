import { useState, useCallback, useEffect, useRef } from "react";
import { postCommand } from "./postCommand";

export function useCanvasSyncSettings(url, courseId, enabled) {
    const [settings, setSettings] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const requestIdRef = useRef(0);

    const refresh = useCallback(() => {
        if (!courseId) return Promise.resolve(null);

        const requestId = ++requestIdRef.current;
        const isCurrent = () => requestId === requestIdRef.current;

        return postCommand(url, {
            asciCourseId: courseId,
            command: "getCanvasLmsSyncSettings",
        })
            .then((data) => {
                if (!isCurrent()) return null;
                if (data.success === "true") {
                    setSettings(data.settings);
                    setError(false);
                    setLoaded(true);
                    return data.settings;
                }
                setError(true);
                setLoaded(true);
                return null;
            })
            .catch((error) => {
                console.log(error);
                if (!isCurrent()) return null;
                setError(true);
                setLoaded(true);
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
            setSettings(null);
            setError(false);
            setLoaded(false);
            refresh();
        } else {
            requestIdRef.current++;
            setSettings(null);
            setError(false);
            setLoaded(false);
        }
    }, [enabled, refresh]);

    return { settings, setSettings, loaded, error, refresh, save };
}
