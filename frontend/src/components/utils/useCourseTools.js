import { useCallback, useMemo } from "react";
import { postCommand } from "./postCommand";
import { useUser } from "../context/UserContext";
import { useExternalTools } from "./useExternalTools";

export const COURSE_TOOLS = [
    { key: "queue", label: "Queue", setting: "queue_enabled" },
    { key: "llm", label: "LLM Chat Bot", setting: "llm_enabled" },
    { key: "canvas", label: "Canvas LMS" },
    { key: "gradescope", label: "Gradescope" },
    { key: "piazza", label: "Piazza" },
];

export function useCourseTools(url, courseId, enabled) {
    const { user, courseSettings, setCourseSettings } = useUser();
    const external = useExternalTools(url, courseId, enabled);
    const saveExternalTool = external.save;

    const tools = useMemo(
        () =>
            COURSE_TOOLS.map((tool) => ({
                ...tool,
                enabled: tool.setting
                    ? courseSettings?.[tool.setting] === "t"
                    : external.tools[tool.key] === true,
            })),
        [courseSettings, external.tools]
    );

    const setToolEnabled = useCallback(
        (key, isEnabled) => {
            const tool = COURSE_TOOLS.find((t) => t.key === key);
            if (!tool.setting) return saveExternalTool(key, isEnabled);

            // Settings the request omits keep their stored values.
            return postCommand(url, {
                command: "setCourseSettings",
                user: user.userid,
                courseId,
                settings: { course_id: courseId, [tool.setting]: isEnabled },
            }).then((data) => {
                if (data.success === "true") setCourseSettings(data.settings);
                return data;
            });
        },
        [url, courseId, user.userid, saveExternalTool, setCourseSettings]
    );

    return {
        tools,
        setToolEnabled,
        externalTools: external.tools,
        lastUploads: external.lastUploads,
        setLastUploads: external.setLastUploads,
        loaded: external.loaded && courseSettings != null,
        error: external.error,
    };
}
