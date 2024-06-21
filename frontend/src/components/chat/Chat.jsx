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

    console.log("course in Chat: ", course);

    const isValidIssueSubject = (issueSubject) => {
        return (
            issueSubject &&
            typeof issueSubject === "string" &&
            issueSubject.trim() !== ""
        );
    };

    const navigate = useNavigate();

    const [isVisible, setIsVisible] = useState(false);
    const [notFoundError, setNotFoundError] = useState(false);

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

    React.useEffect(() => {
        if (isValidIssueSubject(issueSubject)) {
            const autofilledQuestion = {
                assignmentName: "",
                studentQuestion: issueSubject,
            };
            setNewChatQuestion(autofilledQuestion);
            const apiInput = { command: "newLlmChat", ...autofilledQuestion };
            getLlmResponse(apiInput, url);
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

        question.user = user.userid;
        question.course = course;

        const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(question),
        });
        const data = await response.json();
       console.log(data);
        let chatbotResponse = data.response;

        if (response.ok && chatbotResponse) {
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
                className="btn btn-outline-success me-1"
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

    const displayContextList = (contextList) => {
        if (contextList.length > 0) {
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
            return (
                <div
                    id={index}
                    key={index}
                    className="row"
                >
                  <div className="col-8 card text-bg-success m-2 mb-1 p-0">
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
                    <div className="col-8 p-0 m-2">
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
                    <div className="col-4 card text-bg-primary m-2  mb-1">
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
        if (llmProcessing) {
            return (
                <div>
                    {chatHistoryRecords.map((el, i) =>
                        displayChatHistoryRecord(el, i)
                    )}
                  <div className="row">
                    <div className="col-8 card text-bg-success m-2 mb-1 p-0">
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
                </div>
            );
        }
    };

    const displayChatHistory = (chatHistoryRecords) => {
        return (
            <div className="">
                {displayNewChatQuestions(true)}
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
                className=""
            >
              <div class="mb-3">
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
              <div class="mb-3 d-flex justify-content-end">
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
