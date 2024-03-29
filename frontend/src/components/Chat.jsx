import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ArrowUpIcon } from "@heroicons/react/24/outline";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useSpring, animated, config } from "react-spring";
import TypingAnimation from "./utils/TypingMessageAnimation";
import SimpleDialog from "./utils/SimpleDialog";

const Chat = (props) => {
    const url = props.url;
    const docRoot = props.docRoot;

    const getUserAndCourseID = () => {
        if (localStorage.getItem("asci-user") === null) {
            navigate(docRoot + "/login");
        } else if (localStorage.getItem("asci-course") === null) {
            navigate(docRoot + "/selectCourse");
        } else {
            const user = localStorage.getItem("asci-user");
            const courseId = localStorage.getItem("asci-course");
            return { user: user, courseId: courseId };
        }
    };

    const navigate = useNavigate();

    const [isVisible, setIsVisible] = useState(false);
    const [notFoundError, setNotFoundError] = useState(false);

    const slideIn = useSpring({
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : 24,
        config: config.slow,
    });

    // Trigger the animation when the component mounts
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 200);
        return () => clearTimeout(timer); // Clear the timer if the component unmounts
    }, []);

    const [newChatQuestion, setNewChatQuestion] = useState({
        assignmentName: "",
        studentQuestion: "",
    });

    const [followupQuestion, setFollowupQuestion] = useState("");

    const [conversationStarted, setConversationStarted] = useState(false);
    const [llmProcessing, setLlmProcessing] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);

    const handleNewChatInputChange = (e) => {
        const { name, value } = e.target;
        setNewChatQuestion({ ...newChatQuestion, [name]: value });
    };

    const handleFollowupQuestionChange = (e) => {
        setFollowupQuestion(e.target.value);
    };

    const appendToChatHistory = (newMessage) => {
        setChatHistory((prevState) => [...prevState, newMessage]);
    };

    const getLlmResponse = async (question, apiEndpoint) => {
        setLlmProcessing(true);
        const userInfo = getUserAndCourseID();

        question.user = userInfo.user;

        const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(question),
        });
        const data = await response.json();
        const chatbotResponse = JSON.parse(data.response);

        if (response.ok) {
            console.log(chatbotResponse);
            appendToChatHistory(chatbotResponse);
            setLlmProcessing(false);
        } else if (response.status === 401) {
            navigate(`/`);
        } else if (response.status === 404) {
            setNotFoundError(true);
        } else {
        }
    };

    const getFollowupChatResponse = (followupQuestion) => {
        appendToChatHistory({ role: "user", content: followupQuestion });

        const apiInput = {
            command: "followupLlmChat",
            studentQuestion: followupQuestion,
            chatHistory: chatHistory,
        };
        return getLlmResponse(apiInput, url);
    };

    const handleFollowupChatSubmit = (e) => {
        e.preventDefault();
        getFollowupChatResponse(followupQuestion);
        setFollowupQuestion("");
        console.log(chatHistory);
    };

    const handleFollowupChipSubmit = (e) => {
        return getFollowupChatResponse(e.target.textContent);
    };

    const getNewChatResponse = () => {
        const apiInput = { command: "newLlmChat", ...newChatQuestion };
        return getLlmResponse(apiInput, url);
    };

    const handleNewChatSubmit = (e) => {
        e.preventDefault();
        // get LLM response from backend
        getNewChatResponse();
        setConversationStarted(true);
    };

    const handleNewChatKeyDown = (e) => {
        // Check for Command (Mac) or Ctrl (Windows) key + Enter
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            handleNewChatSubmit(e);
        }
    };

    const displayFollowupQuestionChip = (el, index) => {
        return (
            <div
                id={index}
                key={index}
                className="py-2 px-3 rounded-full text-sm inline-flex items-center hover:cursor-pointer shadow my-0"
                onClick={handleFollowupChipSubmit}
            >
                {el}
            </div>
        );
    };

    const displayFollowupQuestionChips = (chatHistoryRecord, index) => {
        const questionsExist = chatHistoryRecord.questions.length > 0;
        const latestMessage = index === chatHistory.length - 1;
        if (questionsExist && latestMessage) {
            return chatHistoryRecord.questions
                .slice(0, 2)
                .map((el, i) => displayFollowupQuestionChip(el, i));
        }
        return null;
    };

    const displayChatHistoryRecord = (chatHistoryRecord, index) => {
        if (chatHistoryRecord.role === "assistant") {
            return (
                <div
                    id={index}
                    key={index}
                    className="flex flex-col space-y-1 mb-6 my-1"
                >
                    <p className="text-base font-bold text-left">TA Bot</p>
                    <div className="relative bg-slate-200 p-4 pb-6 rounded-3xl w-4/5 min-h-12 mr-auto">
                        <Markdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            children={chatHistoryRecord.content}
                            className="prose text-sm max-w-none font-medium my-0 text-left"
                        />
                        <SimpleDialog contexts={chatHistoryRecord.context} />
                    </div>
                    <div className="flex flex-row w-3/4 space-x-2 py-1">
                        {displayFollowupQuestionChips(chatHistoryRecord, index)}
                    </div>
                </div>
            );
        } else if (chatHistoryRecord.role === "user") {
            return (
                <div
                    id={index}
                    key={index}
                    className="flex flex-col space-y-1 mb-4 my-1"
                >
                    <div className="bg-slate-700 p-4 rounded-3xl max-w-4/5 min-h-12 ml-auto">
                        <Markdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            children={chatHistoryRecord.content}
                            className="prose text-sm max-w-none font-medium my-0 text-slate-50 prose-code:text-slate-50"
                        />
                    </div>
                </div>
            );
        }
    };

    const displayChatHistoryRecords = (chatHistoryRecords) => {
        if (llmProcessing) {
            return (
                <div>
                    {chatHistoryRecords.map((el, i) =>
                        displayChatHistoryRecord(el, i)
                    )}
                    <div className="flex flex-1 flex-col m-0 items-start">
                        <p className="text-base font-bold">TA Bot</p>
                        <div className="my-0 mr-auto">
                            <TypingAnimation />
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div>
                    {chatHistoryRecords.map((el, i) =>
                        displayChatHistoryRecord(el, i)
                    )}
                </div>
            );
        }
    };

    const displayChatHistory = (chatHistoryRecords) => {
        return (
            <div className="flex flex-1 flex-col space-y-2 m-4">
                {displayNewChatQuestions(true)}
                {displayChatHistoryRecords(chatHistoryRecords)}
            </div>
        );
    };

    const displayChatInterface = () => {
        if (!conversationStarted) {
            return (
                <div className="flex flex-1 items-center justify-center m-0">
                    <h4 className="tracking-tight font-bold">
                        Ask the TA bot for help
                    </h4>
                </div>
            );
        }
        if (conversationStarted) {
            return displayChatHistory(chatHistory);
        }
    };

    const displayNewChatInput = () => {
        return (
            <animated.div style={slideIn}>
                {displayNewChatQuestions(false)}
            </animated.div>
        );
    };

    const displayNewChatQuestions = (disabled = false) => {
        const questionPlaceholder = disabled
            ? "No question provided"
            : "Enter your question";

        const assignmentPlaceholder = disabled
            ? "Generic question/No assignment provided"
            : "Enter the title of the assignment you are working on, if applicable";

        return (
            <form
                onSubmit={handleNewChatSubmit}
                onKeyDown={handleNewChatKeyDown}
                className="flex flex-col"
            >
                <label className="flex flex-row items-center w-full max-h-20 flex-grow">
                    <div className="w-32 font-bold my-0">Question</div>
                    <textarea
                        className="ml-4 input-base resize-none w-5/6"
                        placeholder={questionPlaceholder}
                        type="text"
                        rows={2}
                        name="studentQuestion"
                        value={newChatQuestion.studentQuestion}
                        disabled={disabled}
                        onChange={handleNewChatInputChange}
                    />
                </label>

                {disabled ? null : (
                    <div className="flex flex-row justify-end m-0">
                        <button
                            type="submit"
                            className="text-button m-0"
                            disabled={newChatQuestion.studentQuestion === ""}
                        >
                            <ArrowUpIcon
                                className="mr-1 text-button-icon"
                                aria-hidden="true"
                            />
                            Submit
                        </button>
                    </div>
                )}
            </form>
        );
    };

    const displayFollowUpChatInput = () => {
        return (
            <form
                onSubmit={handleFollowupChatSubmit}
                className="flex flex-row space-x-4 pt-1"
            >
                <input
                    className="input-base"
                    placeholder="Message the TA bot with a follow-up question"
                    type="text"
                    autoComplete="off"
                    name="followupQuestion"
                    value={followupQuestion}
                    onChange={handleFollowupQuestionChange}
                />
                <button type="submit" className="text-button">
                    <ArrowUpIcon
                        className="mr-1 text-button-icon "
                        aria-hidden="true"
                    />
                    Submit
                </button>
            </form>
        );
    };

    return (
        <div className="flex flex-1 flex-col m-0 max-h-120">
            {displayChatInterface()}
            <div className="sticky bottom-0 flex justify-center flex-col w-full m-0">
                {conversationStarted
                    ? displayFollowUpChatInput()
                    : displayNewChatInput()}
            </div>
        </div>
    );
};

export default Chat;
