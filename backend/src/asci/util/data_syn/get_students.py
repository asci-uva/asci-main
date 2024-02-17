from datetime import timedelta
import requests
from django.utils import timezone
from dotenv import load_dotenv
import os
import json

# Load environment variables from .env.local file
load_dotenv(dotenv_path='../.env.local')

# Access the environment variable
canvas_access_token = os.getenv('CANVAS_ACCESS_TOKEN')


# def set_expiration_by_hour(hour: float):
#     valid_duration = timedelta(hours=hour)
#     current_time = timezone.now()
#     return current_time + valid_duration


def get_data_from_canvas(api_endpoint: str, token: str) -> dict:
    url = api_endpoint + "?access_token=" + token + "&state=available"
    response = requests.get(url)
    return response.json()

class StudentGenerator:
    def __init__(self, config, course_id: str):
        self.config = config
        self.course_id = str(course_id)

    def get_student_data(self, api_endpoint: str) -> dict:
        """Get student data from canvas API

        Args:
            api_endpoint (str): The API endpoint

        Returns:
            dict: A dictionary of student objects
        """
        token = self.config['canvas_token']
        return get_data_from_canvas(api_endpoint, token)

    def create_uva_email_from_computing_id(self, computing_id: str) -> str:
        """Generate UVA emails using computing ID

        Args:
            computing_id (str): a Computing ID

        Returns:
            str: A UVA email address
        """
        return computing_id + "@virginia.edu"

    def create_student(self, student: dict) -> dict:
        """Create a sutdent object using Canvas API response data

        Args:
            student (dict): A Canvas API student object 

        Returns:
            dict: a student object for Early Warning Systems, to be saved into DB
        """

        name = student['name']
        computing_id = student['sis_user_id'] 
        canvas_id = student['id']

        # expiration = set_expiration_by_hour(12)
        email = self.create_uva_email_from_computing_id(computing_id)

        return {
            'name': name,
            'computing_id': computing_id,
            'email': email,
            "canvas_id": canvas_id,
            # "canvas_data_expire_at": expiration,
            'course': self.course_id
        }

    def validate(self, student: dict) -> bool:
        """Validate a student object by checking if it has a name/sis_user_id field

        Args:
            student (dict): A Canvas API student object

        Returns:
            bool: Whether the student object is valid
        """
        return student["name"] and student["sis_user_id"]

    def create_students(self, canvas_students: list[dict]) -> list[dict]:
        """Create a list of student objcts using Canvas data

        Args:
            students (list[dict]): A list of Canvas student object

        Returns:
            list[dict]: A list of student objects, to be inserted into DB
        """
        return [
            self.create_student(s) for s in canvas_students if self.validate(s)
        ]

    def save_student_objects_to_db(self, students: list[dict]) -> None:
        """Save student objects to database

        Args:
            students (list[dict]): A list of student objects
        """
        serialized = StudentSerializer(data=students, many=True)
        serialized.is_valid(raise_exception=True)
        serialized.save()

    def create_and_save_students(self) -> None:
        """Initalize the pipeline get student data from API, 
            create student objects, and save to the database
        """

        base = "https://canvas.its.virginia.edu/api/v1/courses/"
        api_endpoint = base + self.course_id + "/students"
        canvas_students = self.get_student_data(api_endpoint)
        students = self.create_students(canvas_students)

        # self.save_student_objects_to_db(students)
        self.save_students(students)

    def save_students(self, data):
        file_path = 'students.json' 

        # Writing data to a JSON file
        with open(file_path, 'w') as file:
            json.dump(data, file)

        print("Data has been successfully written to", file_path)

config = {'canvas_token': canvas_access_token}
course_id = 71692
a = StudentGenerator(config, course_id)
a.create_and_save_students()