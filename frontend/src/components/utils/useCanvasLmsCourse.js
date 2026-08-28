import { useState, useCallback, useEffect, useRef } from "react";
import { postCommand } from "./postCommand";
import { useUser } from "../context/UserContext";

export function useCanvasLmsCourse(url, courseId, enabled) {
    const [course, setCourse] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const { user, getCourse } = useUser();
    const requestIdRef = useRef(0);

    const refresh = useCallback(() => {
        if (!courseId) return Promise.resolve(null);

        const requestId = ++requestIdRef.current;
        const isCurrent = () => requestId === requestIdRef.current;

        return postCommand(url, {
            asciCourseId: courseId,
            command: "getCanvasLmsCourse",
            user: user.userid
        })
            .then((data) => {
                if (!isCurrent()) return null;
                const next = data.success === "true" ? data.course : null;
                setCourse(next);
                setLoaded(true);
                return next;
            })
            .catch((error) => {
                console.log(error);
                if (!isCurrent()) return null;
                setCourse(null);
                setLoaded(true);
                return null;
            });
    }, [url, courseId]);

    useEffect(() => {
        if (enabled) {
            setCourse(null);
            setLoaded(false);
            refresh();
        } else {
            // Bump the id so a reply still in flight cannot land after this.
            requestIdRef.current++;
            setCourse(null);
            setLoaded(true);
        }
    }, [enabled, refresh]);

    return { course, setCourse, loaded, refresh };
}
