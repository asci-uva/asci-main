import requests
import json
from pathlib import Path
from dateutil.parser import isoparse
# from api.models import GradeScopeAssignment, Student
# from django.db.models import Q
# from django.core.exceptions import ObjectDoesNotExist
from dotenv import load_dotenv
import os
import json

# Load environment variables from .env.local file
load_dotenv(dotenv_path='../.env.local')

# Access the environment variable
canvas_access_token = os.getenv('CANVAS_ACCESS_TOKEN')


class AssignmentGenerator:

    def __init__(self, config, course_id: int, user_canvas_id: int):
        self.config = config
        self.canvas_course_id = course_id
        self.canvas_student_id = user_canvas_id
        self.session = requests.Session()
    
    def set_student_id(self, student_id: int):
        self.canvas_student_id = student_id

    def get_data_from_canvas(self, api_endpoint: str) -> dict:
        """Get data from canvas API

        Args:
            api_endpoint (str): the endpoint

        Returns:
            dict: The data as a dictionary
        """
        token = self.config['canvas_token']
        url = api_endpoint + "?access_token=" + token
        response = self.session.get(url, timeout=12)
        return response.json()

    def get_assignment_category(self, assignment_title: str) -> str:
        """Get the assignment category mapping

        Args:
            assignment_title (str): The assignment title

        Returns:
            str: The corresponding category for the assignment
        """
        mapping_file = Path(__file__).parents[2] / "config_data" / "assignment_categories.json"
        file = open(mapping_file)
        data = json.load(file)
        identifier_category_map = data["assignment_categories"]

        file.close()

        for item in identifier_category_map:
            if item["identifier"] in assignment_title:
                return item["category"], item["weight"]
        return "Other", 0

    def get_base_url(self) -> str:
        """Get the base API URL, which contains the canvas URL, and the course info

        Returns:
            str: the base URL
        """
        base_endpoint = "https://canvas.its.virginia.edu/api/v1/"
        return base_endpoint + "courses/" + str(self.canvas_course_id)

    def get_base_course_url(self) -> str:
        """Get the base API URL, which contains the canvas URL, and the course info

        Returns:
            str: the base URL
        """
        base_endpoint = "https://canvas.its.virginia.edu/"
        return base_endpoint + "courses/" + str(self.canvas_course_id)

    def get_assignment_url(self, canvas_assignment_id: str) -> str:
        """Get assignment's dedicated URL

        Args:
            canvas_assignment_id (str): The canvas assignment ID

        Returns:
            str: The assignment URL
        """
        if canvas_assignment_id:
            assignment_id = canvas_assignment_id
            student_id = self.canvas_student_id
            base = self.get_base_course_url()
            url = f"{base}/assignments/{assignment_id}/submissions/{student_id}"
            return url
        return None

    def get_gradescope_url(self, course_id: str, student_id: str,
                           assignment_id: str) -> str:
        try:
            student = Student.objects.get(canvas_id=student_id)
            student_computing_id = student.computing_id if student else None
        except ObjectDoesNotExist:
            return None
        try:
            gs_assignment = GradeScopeAssignment.objects.get(
                (Q(course_canvas_id=course_id)
                 & Q(assignment_canvas_id=assignment_id)
                 & Q(student_computing_id=student_computing_id)))
            return gs_assignment.gradescope_url
        except ObjectDoesNotExist:
            return None

    def create_assignment(self, assignment: dict) -> dict:
        """Create assignment object using Canvas data

        Args:
            assignment (dict): a Canvas assignment object

        Returns:
            dict: A DB assignment object
        """

        assignment_id = assignment['assignment_id']
        course_id = self.canvas_course_id
        # student_id = self.canvas_student_id

        title = assignment['title']
        points_possible = assignment['points_possible']
        # grading_status = assignment['grading_status']
        due_at = assignment['due_at']
        due_at = isoparse(due_at) if due_at else None
        score = assignment['submission']['score']
        submitted_at = assignment['submission']['submitted_at']
        submitted_at = isoparse(submitted_at) if submitted_at else None
        # url = self.get_assignment_url(assignment_id)
        # gs_url = self.get_gradescope_url(course_id, student_id, assignment_id)
        # category, category_weight = self.get_assignment_category(title)

        return {
            'course_id': course_id,
            'assignment_id': assignment_id,
            'title': title,
            'points_possible': points_possible,
            # "grading_status": grading_status,
            'due_at': due_at,
            'score': round(score, 1) if score else None,
            # 'canvas_data_expire_at': expiration,
            'student_canvas_id': self.canvas_student_id,
            # "category": category,
            # "category_weight": category_weight,
            # "url": url,
            # "gradescope_url": gs_url
        }

    def create_assignments(self, assignments: list[dict]) -> list[dict]:
        """Create all assignments

        Args:
            assignments (list[dict]): A list of Canvas assignment objects

        Returns:
            list[dict]: A list of DB Canvas assignment objects
        """
        return [self.create_assignment(a) for a in assignments]

    def save_assignments_to_db(self, assignments: list[dict]) -> None:
        serialized = AssignmentSerializer(data=assignments, many=True)
        serialized.is_valid(raise_exception=True)
        serialized.save()

    def create_and_save_assignments(self):       
        api_endpoint = self.get_base_url(
        ) + "/analytics/users/" + str(self.canvas_student_id) + "/assignments"
        response = self.get_data_from_canvas(api_endpoint)
        assignments = self.create_assignments(response)
        return assignments


# course_id = 71692
# config = {'canvas_token': canvas_access_token}


# a = AssignmentGenerator(config, course_id, 48909)
# a.create_and_save_assignments()