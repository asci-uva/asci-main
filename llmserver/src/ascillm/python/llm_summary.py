import json
import sys
sys.path.insert(0,'/usr/lib/python3.10/site-packages')
from llm_chat.openai_connector import OpenaiConnector
from llm_chat.constants import LLAMAFILE_KEY_PLACEHOLDER, LLAMAFILE_BASE_URL

MOCKING_LLM_RESPONSE = False

RUN_MAIN = False

MOCK_SUMMARY = {
    "role": "assistant",
    "content": "The student is struggling with x, y, and z. They may need guidance in these areas. ",
    "questions": ["This is a list of mock questions"],
    "context": None,
}


def get_summary(input_object: dict[str, str], course):
    if MOCKING_LLM_RESPONSE:
        return MOCK_SUMMARY
    else:
        question = input_object["question"]
        code = input_object["code"]

        connector = OpenaiConnector(LLAMAFILE_BASE_URL, LLAMAFILE_KEY_PLACEHOLDER, course)
        response = connector.create_summary(question, code) 
        return response
    

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
    res = get_summary(input_object, course)
    json_res = json.dumps(res)
    print(json_res, end="")

if RUN_MAIN:

    print("run main")
    sys.stdout.flush()  
    dataIn = [
        '{"command":"newLlmSummary","assignmentName":"","question":"hw2: homework help","user":"mrf8t"}',
        "-1",
    ]
    if dataIn:
        input_object = json.loads(dataIn[0])
        res = get_summary(input_object, course)
        json_res = json.dumps(res)
        print(json_res, end="")
