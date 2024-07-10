import json
import sys
sys.path.insert(0,'/usr/lib/python3.10/site-packages')
from llm_chat.openai_connector import OpenaiConnector
from llm_chat.constants import LLAMAFILE_KEY_PLACEHOLDER, LLAMAFILE_BASE_URL


MOCKING_LLM_RESPONSE = False

RUN_MAIN = False

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


def get_newchat_response(input_object: dict[str, str], course):
    if MOCKING_LLM_RESPONSE:
        return MOCK_NEWCHAT_RESPONSE
    else:
        question = input_object["studentQuestion"]

        connector = OpenaiConnector(LLAMAFILE_BASE_URL, LLAMAFILE_KEY_PLACEHOLDER, course)
        response = connector.create_newchat(question)
        return response


def get_followup_response(input_object: dict[str, str], course):
    if MOCKING_LLM_RESPONSE:
        return MOCK_FOLLOWUP_RESPONSE
    else:
        question = input_object["studentQuestion"]
        chat_history = input_object["chatHistory"]
        connector = OpenaiConnector(LLAMAFILE_BASE_URL, LLAMAFILE_KEY_PLACEHOLDER, course)
        response = connector.create_followup(question, chat_history)
        return response


def get_llm_response(input_object: dict[str, str], course):
    command = input_object["command"]

    is_newchat = command == "newLlmChat"
    is_followup = command == "followupLlmChat"

    if is_newchat:
        return get_newchat_response(input_object, course)
    elif is_followup:
        return get_followup_response(input_object, course)


if len(sys.argv) < 2:
    print("Course number required")
    sys.exit(1)

course = sys.argv[1]

# READ IN DATA FROM STANDARD INPUT, ONE STRING ENTRY PER LINE
dataIn = []

for line in sys.stdin:
    cleaned = line.strip()
    if cleaned:
        dataIn.append(cleaned)

#while len(dataIn) <= 2:
#    input_line = input()
    # quit when we see a -1
#    if input_line == "-1":
#        break

#    dataIn.append(input_line)


if dataIn:
    input_object = json.loads(dataIn[0])
    res = get_llm_response(input_object, course)
    json_res = json.dumps(res)
    print(json_res, end="")

if RUN_MAIN:

    print("run main")
    dataIn = [
        '{"command":"newLlmChat","assignmentName":"","studentQuestion":"hw2: homework help","user":"mrf8t"}',
        "-1",
    ]
    if dataIn:
        input_object = json.loads(dataIn[0])
        res = get_llm_response(input_object, course)
        json_res = json.dumps(res)
        print(json_res, end="")
