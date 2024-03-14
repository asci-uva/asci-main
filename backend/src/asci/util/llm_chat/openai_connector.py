from openai import OpenAI
from .utils.chat_history_formatter import ChatHistoryFormatter
from .utils.gpt_runner import GPTRunner
from .utils.prompt_builder import PromptBuilder


class OpenaiConnector:
    def __init__(self, openai_api_key):
        self.client = OpenAI(api_key=openai_api_key)
        self.formatter = ChatHistoryFormatter()
        self.prompt_builder = PromptBuilder()
        self.runner = GPTRunner(self.client)

    def create_newchat(self, question: str, assignment: str = ""):
        messages = self.prompt_builder.build_newchat_messages(question, assignment)
        try:
            res = self.runner.get_response_from_question_and_history(question, messages)
            return res
        except Exception as e:
            raise ValueError(f"Error requesting GPT response: {str(e)}")

    def create_followup(self, question: str, messages: list):
        try:
            messages = self.formatter.format_openai_messages(messages)
            messages = self.formatter.append_user_message_to_history(question, messages)

            res = self.runner.get_response_from_question_and_history(question, messages)
            return res
        except Exception as e:
            raise ValueError(f"Error requesting GPT response in follow-up: {str(e)}")
