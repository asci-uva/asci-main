import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ArrowUpIcon } from "@heroicons/react/24/outline";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useSpring, animated, config } from "react-spring";
import TypingAnimation from "../utils/TypingMessageAnimation";
import SimpleDialog from "../utils/SimpleDialog";
import { useUser } from "../context/UserContext";

const Chat = (props) => {
    const url = props.url;
    const docRoot = props.docRoot;
    const issueSubject = props.issueSubject;
    let {user, getCourse} = useUser();
    let course = getCourse();

    const isValidIssueSubject = (issueSubject) => {
        return (
            issueSubject &&
            typeof issueSubject === "string" &&
            issueSubject.trim() !== ""
        );
    };

    const navigate = useNavigate();

    const [isVisible, setIsVisible] = useState(false);

    const slideIn = useSpring({
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : 24,
        config: config.slow,
    });

    const [newChatQuestion, setNewChatQuestion] = useState({
        assignmentName: "",
        studentQuestion: isValidIssueSubject(issueSubject) ? issueSubject : "",
    });

    const [followupQuestion, setFollowupQuestion] = useState("");

    const [conversationStarted, setConversationStarted] = useState(false);
    const [llmProcessing, setLlmProcessing] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [chatErrorMessage, setChatErrorMessage] = useState("");

    const defaultChatErrorMessage =
        "Sorry, something went wrong while contacting the TA bot. Please try again.";

    const clearChatErrors = () => {
        setChatErrorMessage("");
    };

    const showChatError = (message = defaultChatErrorMessage) => {
        setChatErrorMessage(message);
    };

    React.useEffect(() => {
        if (isValidIssueSubject(issueSubject)) {
            const autofilledQuestion = {
                assignmentName: "",
                studentQuestion: issueSubject,
            };
            setNewChatQuestion(autofilledQuestion);
            clearChatErrors();
            const apiInput = { command: "newLlmChat", ...autofilledQuestion };
            getLlmResponseStreaming(apiInput, url);
            setConversationStarted(true);
        }
    }, [issueSubject]);

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
        clearChatErrors();

        question.user = user.userid;
        question.course = course;

        try {
            const response = await fetch(apiEndpoint, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(question),
            });

            let data = {};
            try {
                data = await response.json();
            } catch (e) {
                data = {};
            }

            console.log(data);
            const chatbotResponse = data.response;

            if (response.ok && chatbotResponse) {
                console.log(chatbotResponse);
                appendToChatHistory(chatbotResponse);
                return;
            }

            if (response.status === 401) {
                navigate(`/`);
                return;
            }

            if (response.status === 404) {
                showChatError(
                    "Sorry, the TA bot service is unavailable for this course. Please contact your instructor."
                );
                return;
            }

            showChatError(
                data?.error?.message || data?.message || defaultChatErrorMessage
            );
        } catch (err) {
            console.error("Non-streaming fetch failed:", err);
            showChatError(defaultChatErrorMessage);
        } finally {
            setLlmProcessing(false);
        }
    };

    const getLlmResponseStreaming = async (question, apiEndpoint) => {
        setLlmProcessing(true);
        clearChatErrors();

        question.user = user.userid;
        question.course = course;

        // Use streaming command variant
        const streamCommand = question.command === "newLlmChat"
            ? "newLlmChatStream"
            : "followupLlmChatStream";
        const streamQuestion = { ...question, command: streamCommand };

        try {
            const response = await fetch(apiEndpoint, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(streamQuestion),
            });

            if (response.status === 401) {
                navigate(`/`);
                return;
            }
            if (response.status === 404) {
                showChatError(
                    "Sorry, the TA bot service is unavailable for this course. Please contact your instructor."
                );
                return;
            }
            if (!response.ok || !response.body) {
                // Fallback to non-streaming
                return await getLlmResponse(question, apiEndpoint);
            }

            // Add a placeholder message for the streaming response
            const placeholderMsg = { role: "assistant", content: "", questions: [], context: [] };
            appendToChatHistory(placeholderMsg);

            let streamHadError = false;
            let streamReturnedContent = false;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamedContent = "";
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                // Keep the last partial line in the buffer
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith("data: ")) continue;

                    try {
                        const event = JSON.parse(trimmed.slice(6));

                        if (event.type === "token") {
                            streamedContent += event.content;
                            streamReturnedContent = true;
                            setChatHistory((prev) => {
                                const updated = [...prev];
                                updated[updated.length - 1] = {
                                    ...updated[updated.length - 1],
                                    content: streamedContent,
                                };
                                return updated;
                            });
                        } else if (event.type === "status") {
                            // Optional: could display status message
                        } else if (event.type === "done" && event.data) {
                            // Replace with the final response (includes context, questions, cleaned content)
                            streamReturnedContent = true;
                            setChatHistory((prev) => {
                                const updated = [...prev];
                                updated[updated.length - 1] = event.data;
                                return updated;
                            });
                        } else if (event.type === "error") {
                            console.error("LLM streaming error:", event.message);
                            streamHadError = true;
                            const errorMessage = event.message || defaultChatErrorMessage;
                            showChatError(errorMessage);
                            setChatHistory((prev) => {
                                const updated = [...prev];
                                if (updated.length > 0) {
                                    updated[updated.length - 1] = {
                                        role: "assistant",
                                        content: errorMessage,
                                        questions: [],
                                        context: [],
                                    };
                                }
                                return updated;
                            });
                            break;
                        }
                    } catch (e) {
                        // Skip malformed JSON lines
                    }
                }

                if (streamHadError) {
                    break;
                }
            }

            if (!streamHadError && !streamReturnedContent) {
                setChatHistory((prev) => {
                    if (prev.length > 0 && prev[prev.length - 1].content === "") {
                        return prev.slice(0, -1);
                    }
                    return prev;
                });
                return await getLlmResponse(question, apiEndpoint);
            }
        } catch (err) {
            console.error("Streaming fetch failed, falling back:", err);
            // Remove the placeholder if it was added
            setChatHistory((prev) => {
                if (prev.length > 0 && prev[prev.length - 1].content === "") {
                    return prev.slice(0, -1);
                }
                return prev;
            });
            return await getLlmResponse(question, apiEndpoint);
        } finally {
            setLlmProcessing(false);
        }
    };

    const formatChatHistory = (chatHistory) => {
        return chatHistory.map((el) => {
            return {
                role: el.role,
                content: el.content,
            };
        });
    };

    const getFollowupChatResponse = (followupQuestion) => {
        appendToChatHistory({ role: "user", content: followupQuestion });

        const apiInput = {
            command: "followupLlmChat",
            studentQuestion: followupQuestion,
            chatHistory: formatChatHistory(chatHistory),
        };
        return getLlmResponseStreaming(apiInput, url);
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
        appendToChatHistory({ role: "user", content: newChatQuestion.studentQuestion });

        const apiInput = { command: "newLlmChat", ...newChatQuestion };
        return getLlmResponseStreaming(apiInput, url);
    };

    const handleNewChatSubmit = (e) => {
        e.preventDefault();
        // get LLM response from backend
        getNewChatResponse();
        setConversationStarted(true);
    };

    const handleNewChatKeyDown = (e) => {
        // Check for Command (Mac) or Ctrl (Windows) key + Enter
        //if ((e.metaKey || e.ctrlKey) && e.key === "Enter")
        //if Enter command is pressed on its own (no Ctrl or Command) submit chat
        if (e.key === "Enter") {
            if(!conversationStarted)
            {
                handleNewChatSubmit(e);
            }
            else
            {
                handleFollowupChatSubmit(e);
            }
            
        }
    };

    const displayFollowupQuestionChip = (el, index) => {
        return (
            <div
                id={index}
                key={index}
                className="btn btn-outline-success me-1"
                onClick={handleFollowupChipSubmit}
            >
                {el}
            </div>
        );
    };

    const displayFollowupQuestionChips = (chatHistoryRecord, index) => {
        const questionsExist = chatHistoryRecord.questions && chatHistoryRecord.questions.length > 0;
        const latestMessage = index === chatHistory.length - 1;
        if (questionsExist && latestMessage) {
            return chatHistoryRecord.questions
                .slice(0, 2)
                .map((el, i) => displayFollowupQuestionChip(el, i));
        }
        return null;
    };

    const displayContextList = (contextList) => {
        if (contextList && contextList.length > 0) {
          return (<div className="card-footer">
            <p className="mb-1" >This answer came from the following course documents:</p>
            <dl>
              {contextList.map((el, i) => displayContext(el, i))}
            </dl>
          </div>
          )

        }
      return null;
    };

  const displayContext = (context, i) => {
    return (
      <>
        <dt>{context.file_name}
                    {context.page_label
                      ? ` (page/slide: ${context.page_label})`
                        : null}</dt>
        <dd>{context.text}</dd>
      </>
    )

  }

    const displayChatHistoryRecord = (chatHistoryRecord, index) => {
        if (chatHistoryRecord.role === "assistant") {
            // Skip rendering empty placeholder messages (used during streaming startup)
            if (!chatHistoryRecord.content && llmProcessing) return null;
            return (
                <div
                    id={index}
                    key={index}
                    className="row"
                >
                  <div className="col-10 card text-bg-success m-2 mb-1 p-0">
                    <div className="card-header">TA Bot</div>
                    <div className="card-body">
                        <Markdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            children={chatHistoryRecord.content}
                            className=""
                        />
                    </div>
                        {displayContextList(chatHistoryRecord.context)}
                  </div>
                    <div className="col-10 p-0 m-2">
                        {displayFollowupQuestionChips(chatHistoryRecord, index)}
                    </div>
                </div>
            );
        } else if (chatHistoryRecord.role === "user") {
            return (
                <div
                    id={index}
                    key={index}
                    className="row justify-content-end"
                >
                    <div className="col-5 card text-bg-primary m-2  mb-1">
                      <div className="card-body">
                        <Markdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            children={chatHistoryRecord.content}
                            className="chat-markdown"
                        />
                      </div>
                    </div>
                </div>
            );
        }
    };

    const displayChatHistoryRecords = (chatHistoryRecords) => {
        const hasStreamingContent = llmProcessing &&
            chatHistoryRecords.length > 0 &&
            chatHistoryRecords[chatHistoryRecords.length - 1].role === "assistant" &&
            chatHistoryRecords[chatHistoryRecords.length - 1].content !== "";

        if (llmProcessing && !hasStreamingContent) {
            // Waiting for first token - show spinner
            return (
                <div>
                    {chatHistoryRecords.map((el, i) =>
                        displayChatHistoryRecord(el, i)
                    )}
                  <div className="row">
                    <div className="col-10 card text-bg-success m-2 mb-1 p-0">
                      <div className="card-header">TA Bot</div>
                      <div className="card-body text-center">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
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
                    {llmProcessing && hasStreamingContent && (
                        <div className="row">
                            <div className="col-10 m-2 mb-1 p-0 text-muted small">
                                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                Generating response...
                            </div>
                        </div>
                    )}
                </div>
            );
        }
    };

    const displayChatHistory = (chatHistoryRecords) => {
        return (
            <div className="">
                {/* do not display initial question above chat interface */}
                {/* {displayNewChatQuestions(true)} */}
                {chatErrorMessage ? (
                        <div className="alert alert-danger" role="alert">
                                {chatErrorMessage}
                        </div>
                ) : null}
                <div className="my-4 chathistory card">
                  <div className="card-body">
                    {displayChatHistoryRecords(chatHistoryRecords)}
                  </div>
                </div>
            </div>
        );
    };

    const displayChatInterface = () => {
        if (conversationStarted) {
            return displayChatHistory(chatHistory);
        } 
    };

    const displayNewChatInput = () => {
        return (
            <div>
                {displayNewChatQuestions(false)}
            </div>
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
                className="mb-3"
            >
              <div className="mb-3">
                <label className="form-label">
                    Question
                </label>
                <textarea
                  className="form-control"
                  placeholder={questionPlaceholder}
                  type="text"
                  rows={2}
                  name="studentQuestion"
                  value={newChatQuestion.studentQuestion}
                  disabled={disabled}
                  onChange={handleNewChatInputChange}
                />
              </div>

                {disabled ? null : (
                    <div className="mb-3 d-flex justify-content-end">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={newChatQuestion.studentQuestion === ""}
                        >
                            <i className="bi-arrow-up-square-fill"
                                aria-hidden="true"
                            ></i> &nbsp; 
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
                onKeyDown={handleNewChatKeyDown}
                className=""
            >
              <div className="mb-3">
                <textarea
                    className="form-control"
                    placeholder="Message the TA bot with a follow-up question"
                    type="text"
                    autoComplete="off"
                    name="followupQuestion"
                    value={followupQuestion}
                    onChange={handleFollowupQuestionChange}
                />
              </div>
              <div className="mb-3 d-flex justify-content-end">
                <button type="submit" className="btn btn-primary">
                            <i className="bi-arrow-up-square-fill"
                                aria-hidden="true"
                            ></i> &nbsp; 
                    Submit
                </button>
              </div>
            </form>
        );
    };

    return (
        <div className="row">
          <div className="col-12">
            {displayChatInterface()}
            <div className="">
                {conversationStarted
                    ? displayFollowUpChatInput()
                    : displayNewChatInput()}
            </div>
          </div>
        </div>
    );
};

export default Chat;
