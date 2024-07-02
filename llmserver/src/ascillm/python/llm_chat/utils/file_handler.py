import os


class FileHandler:
    def get_file_path(self, filename: str) -> str:
        return os.path.join(os.path.dirname(__file__), filename)

    def get_file_content(self, file_path: str) -> str:
        try:
            with open(file_path, "r") as template_file:
                return template_file.read()
        except FileNotFoundError:
            raise ValueError(f"Prompt template file not found at: {file_path}")

    def read_file(self, filename: str) -> str:
        file_path = self.get_file_path(filename)
        file_content = self.get_file_content(file_path)
        return file_content
