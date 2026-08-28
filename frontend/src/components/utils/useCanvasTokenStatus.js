import { useState, useCallback, useEffect, useRef } from "react";
import { postCommand } from "./postCommand";

export const DEFAULT_TOKEN_STATUS = {
    hasPrimaryInstructor: false,
    hasToken: false,
    isTokenWorking: false,
    isTokenExpired: false,
    isPrimaryInstructor: false,
};

export function useCanvasTokenStatus(url, courseId, enabled) {
    const [status, setStatus] = useState(DEFAULT_TOKEN_STATUS);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const requestIdRef = useRef(0);

    const refresh = useCallback(() => {
        if (!courseId) return Promise.resolve(null);

        const requestId = ++requestIdRef.current;
        const isCurrent = () => requestId === requestIdRef.current;

        return postCommand(url, {
            asciCourseId: courseId,
            command: "getCanvasLmsTokenStatus",
        })
            .then((data) => {
                if (!isCurrent()) return null;
                if (data.success === "true") {
                    const next = {
                        hasPrimaryInstructor: Boolean(data.hasPrimaryInstructor),
                        hasToken: Boolean(data.hasToken),
                        isTokenWorking: Boolean(data.isTokenWorking),
                        isTokenExpired: Boolean(data.isTokenExpired),
                        isPrimaryInstructor: Boolean(data.isPrimaryInstructor),
                    };
                    setStatus(next);
                    setError(false);
                    setLoaded(true);
                    return next;
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

    useEffect(() => {
        if (enabled) {
            setStatus(DEFAULT_TOKEN_STATUS);
            setError(false);
            setLoaded(false);
            refresh();
        } else {
            requestIdRef.current++;
            setStatus(DEFAULT_TOKEN_STATUS);
            setError(false);
            setLoaded(true);
        }
    }, [enabled, refresh]);

    return { status, loaded, error, refresh };
}
