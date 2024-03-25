from llm_chat.openai_connector import OpenaiConnector
from llm_chat.constants import LLAMAFILE_KEY_PLACEHOLDER

MOCKING_LLM_RESPONSE = True

MOCK_NEWCHAT_RESPONSE = {
    "role": "assistant",
    "content": "Hello from LLM chat! You started a new chat.",
    "questions": ["This is a list of mock question"],
    "context": None,
}

MOCK_FOLLOWUP_RESPONSE = {
    "role": "assistant",
    "content": "Hello from LLM chat! You sent a follow-up question.",
    "questions": ["This is a list of mock question"],
    "context": None,
}


def get_newchat_response(input_object: dict[str, str]):
    if MOCKING_LLM_RESPONSE:
        return MOCK_NEWCHAT_RESPONSE
    else:
        question = input_object["question"]
        connector = OpenaiConnector(LLAMAFILE_KEY_PLACEHOLDER)
        response = connector.create_newchat(question)
        return response


def get_followup_response(input_object: dict[str, str]):
    if MOCKING_LLM_RESPONSE:
        return MOCK_FOLLOWUP_RESPONSE
    else:
        question = input_object["question"]
        chat_history = input_object["chatHistory"]
        connector = OpenaiConnector(LLAMAFILE_KEY_PLACEHOLDER)
        response = connector.create_followup(question, chat_history)
        return response


def get_llm_response(input_object: dict[str, str]):
    is_newchat = "studentQuestion" in input_object and "assignmentName" in input_object
    is_followup = "studentQuestion" in input_object and "chatHistory" in input_object

    if is_newchat:
        return get_newchat_response(input_object)
    elif is_followup:
        return get_followup_response(input_object)


# READ IN DATA FROM STANDARD INPUT, ONE STRING ENTRY PER LINE
dataIn = []

while len(dataIn) <= 2:
    input_line = input()
    # quit when we see a -1
    if input_line == "-1":
        break

    dataIn.append(input_line)

if dataIn[-1] == "-1":
    input_object = dict(dataIn[0])
    ret = get_llm_response(input_object)
    print(ret, end="")
