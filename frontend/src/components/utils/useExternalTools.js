import { useState, useCallback, useEffect, useRef } from "react";
import { postCommand } from "./postCommand";
import { useUser } from "../context/UserContext";

const NO_TOOLS = {};

export function useExternalTools(url, courseId, enabled) {
    const [tools, setTools] = useState(NO_TOOLS);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const { user, getCourse } = useUser();
    const requestIdRef = useRef(0);

    const refresh = useCallback(() => {
        if (!courseId) return Promise.resolve(null);

        const requestId = ++requestIdRef.current;
        const isCurrent = () => requestId === requestIdRef.current;

        return postCommand(url, {
            asciCourseId: courseId,
            command: "getExternalTools",
            user: user.userid
        })
            .then((data) => {
                if (!isCurrent()) return null;
                if (data.success === "true") {
                    setTools(data.tools || NO_TOOLS);
                    setError(false);
                    setLoaded(true);
                    return data.tools;
                }
                setError(true);
                setLoaded(true);
                return null;
            })
            .catch((e) => {
                console.log(e);
                if (!isCurrent()) return null;
                setError(true);
                setLoaded(true);
                return null;
            });
    }, [url, courseId]);

    const save = useCallback(
        (tool, isEnabled) =>
            postCommand(url, {
                asciCourseId: courseId,
                tool,
                enabled: isEnabled,
                command: "setExternalToolEnabled",
                user: user.userid
            }).then((data) => {
                if (data.success === "true") setTools(data.tools || NO_TOOLS);
                return data;
            }),
        [url, courseId]
    );

    useEffect(() => {
        if (enabled) {
            setTools(NO_TOOLS);
            setError(false);
            setLoaded(false);
            refresh();
        } else {
            requestIdRef.current++;
            setTools(NO_TOOLS);
            setError(false);
            setLoaded(false);
        }
    }, [enabled, refresh]);

    return { tools, loaded, error, refresh, save };
}
