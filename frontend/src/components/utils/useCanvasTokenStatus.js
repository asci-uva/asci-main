import { useState, useCallback, useEffect } from "react";
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

    const refresh = useCallback(() => {
        if (!courseId) return Promise.resolve(null);
        return postCommand(url, {
            asciCourseId: courseId,
            command: "getCanvasLmsTokenStatus",
        })
            .then((data) => {
                if (data.success === "true") {
                    const next = {
                        hasPrimaryInstructor: Boolean(data.hasPrimaryInstructor),
                        hasToken: Boolean(data.hasToken),
                        isTokenWorking: Boolean(data.isTokenWorking),
                        isTokenExpired: Boolean(data.isTokenExpired),
                        isPrimaryInstructor: Boolean(data.isPrimaryInstructor),
                    };
                    setStatus(next);
                    return next;
                }
                return null;
            })
            .catch((error) => {
                console.log(error);
                return null;
            });
    }, [url, courseId]);

    useEffect(() => {
        if (enabled) {
            refresh();
        } else {
            setStatus(DEFAULT_TOKEN_STATUS);
        }
    }, [enabled, refresh]);

    return { status, refresh };
}
