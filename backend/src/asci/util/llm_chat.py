from llm_chat.openai_connector import OpenaiConnector
from llm_chat.constants import LLAMAFILE_KEY_PLACEHOLDER

MOCK_RESPONSE = True


def get_llm_response(input_object: dict[str, str]):
    if MOCK_RESPONSE:
        return {
            "role": "assistant",
            "content": "Hello from LLM chat! This is a mock response",
            "questions": ["What is the meaning of life?"],
            "context": "This is a mock context",
        }
    else:
        question = input_object["question"]
        connector = OpenaiConnector(LLAMAFILE_KEY_PLACEHOLDER)
        response = connector.create_newchat(question)
        return response


# READ IN DATA FROM STANDARD INPUT, ONE STRING ENTRY PER LINE
dataIn = []

while dataIn <= 2:
    row = input()
    # quit when we see a -1
    if row == "-1":
        break

    dataIn.append(row)

if dataIn[-1] == "-1":
    ret = get_llm_response(dataIn[0])
    print(ret, end="")
