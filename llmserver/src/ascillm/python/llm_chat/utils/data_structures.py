class OpenAIInput(dict):
    def __init__(self, role: str, content: str) -> None:
        self.role = role
        self.content = content

    def __getattr__(self, attr):
        return self[attr]


class OpenAIResponse(dict):
    def __init__(self, role: str, content: str, questions=None, context=None) -> None:
        self.role = role
        self.content = content
        self.questions = questions
        self.context = context

    def __getattr__(self, attr):
        return self[attr]
