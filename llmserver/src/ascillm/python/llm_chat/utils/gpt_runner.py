import re
import sys
import json
from llama_index.core.chat_engine import (
    CondensePlusContextChatEngine,
)
from llama_index.core import Settings
from llama_index.core import PromptTemplate
from .file_handler import FileHandler
from .chat_history_formatter import ChatHistoryFormatter
from .prompt_builder import PromptBuilder
from ..constants import (
    prompt_paths,
    OPENAI_MODEL,
    OPENAI_MAX_TOKENS,
    SHOWING_ONLY_ONE_CONTEXT,
    RAG_DISABLED,
    LLAMAFILE_BASE_URL_HOME,
)
from llama_index.llms.llamafile import Llamafile
from llama_index.core.chat_engine.types import AgentChatResponse
from .rag import load_rag_index
from .data_structures import OpenAIResponse

Settings.llm = Llamafile(base_url=LLAMAFILE_BASE_URL_HOME)


class GPTRunner:
    def __init__(self, client, course):
        self.client = client
        self.file_handler = FileHandler()
        self.formatter = ChatHistoryFormatter()
        self.prompt_builder = PromptBuilder()
        self.course = course

    def get_gpt_response(self, messages: list, response_format=None) -> str:
        response = self.client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            response_format=response_format,
            max_tokens=OPENAI_MAX_TOKENS,
            temperature=0,
        )
        gpt_response = response.choices[0].message.content
        return gpt_response

    def clean_rag_context_text(self, context_text: str) -> str:
        cleaned_context = context_text.lstrip(" 0123456789")
        cleaned_context = context_text.rstrip(" 0123456789")
        return cleaned_context[:400]

    def clean_rag_context(self, context: list[dict]) -> list[dict]:
        cleaned_context = []
        visited_filenames = set()
        for item in context:
            if item["file_name"] not in visited_filenames:
                item["text"] = self.clean_rag_context_text(item["text"])
                cleaned_context.append(item)
                visited_filenames.add(item["file_name"])
        return cleaned_context

    def get_context_from_rag_response(self, response: AgentChatResponse) -> list[dict]:
        if SHOWING_ONLY_ONE_CONTEXT:
            source_nodes = [response.source_nodes[0]]
        else:
            source_nodes = response.source_nodes
        contexts = []
        for node in source_nodes:
            metadata = node.metadata
            text = node.text
            context = {"file_name": metadata["file_name"], "text": text}

            if "page_label" in metadata:
                context["page_label"] = metadata["page_label"]

            contexts.append(context)

        contexts = self.clean_rag_context(contexts)
        return contexts

    def get_gpt_response_with_rag(self, index, message, history) -> dict[str, str]:
        retriever = index.as_retriever(similarity_top_k=3)

        prompt_path = prompt_paths["condense_chat_history"].user
        prompt_content = self.file_handler.read_file(prompt_path)
        custom_prompt = PromptTemplate(prompt_content)

        custom_chat_history = [
            self.formatter.format_message_as_chatmessage(message) for message in history
        ]

        chat_engine = CondensePlusContextChatEngine.from_defaults(
            retriever=retriever,
            condense_question_prompt=custom_prompt,
            chat_history=custom_chat_history,
            verbose=False,
        )
        response = chat_engine.chat(message=message)

        contexts = self.get_context_from_rag_response(response)

        gpt_response = {
            "response": response.response,
            "contexts": contexts,
        }

        return gpt_response

    def detect_code_in_response(self, response: str) -> bool:
        code_block_in_response = response.find("```") != -1

        sixteen_chars_between_ticks_pattern = r"`.{16,}`"
        tick_matches = re.findall(sixteen_chars_between_ticks_pattern, response)
        return code_block_in_response or len(tick_matches) > 0

    def remove_code_in_response(self, question: str, response: str) -> str:
        if not self.detect_code_in_response(response):
            return response

        prompts = prompt_paths["code_removal"]

        system_prompt = self.file_handler.read_file(prompts.system)
        user_prompt = self.file_handler.read_file(prompts.user)
        user_prompt = user_prompt.format(question=question, response=response)

        try:
            messages = self.prompt_builder.build_messages(system_prompt, user_prompt)
            gpt_response = self.get_gpt_response(messages)

            return gpt_response
        except Exception as e:
            raise ValueError(f"Error requesting GPT response: {str(e)}")

    def get_question_starter(self, question: str, llm_response: str):
        prompts = prompt_paths["question_starter"]

        system_prompt = prompts.system
        user_prompt = prompts.user

        system_prompt = self.file_handler.read_file(system_prompt)
        user_template = self.file_handler.read_file(user_prompt)
        user_prompt = user_template.format(
            student_question=question, llm_response=llm_response
        )

        messages = self.prompt_builder.build_messages(system_prompt, user_prompt)

        try:
            response = self.get_gpt_response(messages)
            response_json = json.loads(response)
            return {"questions": response_json}
        except Exception as e:
            raise ValueError(f"Error requesting question starter response: {str(e)}")

    def get_response_from_question_and_history(self, question: str, history: list):
        contexts = None
        if RAG_DISABLED:
            response = self.get_gpt_response(history)
            response = self.remove_code_in_response(question, response)
        else:
            index = load_rag_index(self.course)
            gpt_response = self.get_gpt_response_with_rag(index, question, history)
            response, contexts = gpt_response["response"], gpt_response["contexts"]
            response = self.remove_code_in_response(question, response)

        questions = self.get_question_starter(question, response)

        try:
            response = OpenAIResponse(
                "assistant", response, questions["questions"], contexts
            )
            return vars(response)
        except Exception as e:
            print(f"Error creating OpenAIResponse: {str(e)}")
