from .file_handler import FileHandler
from ..constants import prompt_paths


class PromptBuilder:
    def __init__(self):
        self.file_handler = FileHandler()

    def get_assignment_handout(self, assignment: str = "") -> str:
        return "<No handout provided>"

    def build_newchat_user_prompt(self, question: str, assignment: str) -> str:
        handout = self.get_assignment_handout(assignment)
        user_prompt = prompt_paths["new_chat"].user
        user_prompt = self.file_handler.read_file(user_prompt)

        return user_prompt.format(handout=handout, question=question)

    def build_newchat_system_prompt(self) -> str:
        system_prompt = prompt_paths["new_chat"].system
        return self.file_handler.read_file(system_prompt)

    def build_messages(self, system_prompt, user_prompt):
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        return messages

    def build_newchat_messages(self, question, assignment):
        system_prompt = self.build_newchat_system_prompt()
        user_prompt = self.build_newchat_user_prompt(question, assignment)

        return self.build_messages(system_prompt, user_prompt)
