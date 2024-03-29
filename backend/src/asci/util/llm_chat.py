import json
from llm_chat.openai_connector import OpenaiConnector
from llm_chat.constants import LLAMAFILE_KEY_PLACEHOLDER, LLAMAFILE_BASE_URL

MOCKING_LLM_RESPONSE = False

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
        question = input_object["studentQuestion"]

        connector = OpenaiConnector(LLAMAFILE_BASE_URL, LLAMAFILE_KEY_PLACEHOLDER)
        response = connector.create_newchat(question)
        return response


def get_followup_response(input_object: dict[str, str]):
    if MOCKING_LLM_RESPONSE:
        return MOCK_FOLLOWUP_RESPONSE
    else:
        question = input_object["studentQuestion"]
        chat_history = input_object["chatHistory"]
        connector = OpenaiConnector(LLAMAFILE_BASE_URL, LLAMAFILE_KEY_PLACEHOLDER)
        response = connector.create_followup(question, chat_history)
        return response


def get_llm_response(input_object: dict[str, str]):
    command = input_object["command"]

    is_newchat = command == "newLlmChat"
    is_followup = command == "followupLlmChat"

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


if dataIn:
    input_object = json.loads(dataIn[0])
    res = get_llm_response(input_object)
    json_res = json.dumps(res)
    print(json_res, end="")
