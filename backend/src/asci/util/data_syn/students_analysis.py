import requests
import json
from pathlib import Path
from dateutil.parser import isoparse
from dotenv import load_dotenv
import os
import json
from get_assignments import AssignmentGenerator
# Load environment variables from .env.local file
load_dotenv(dotenv_path='../.env.local')

# Access the environment variable
canvas_access_token = os.getenv('CANVAS_ACCESS_TOKEN')


# all student ids for the course
students = []
file_path = 'students.json'
# Reading data from JSON file
with open(file_path, 'r') as file:
    data = json.load(file)
    for entry in data:
        student = {'name': entry['name'], 'canvas_id': entry['canvas_id']}
        # Extracting the canvas_id and adding to the list
        students.append(student)


course_id = 71692
config = {'canvas_token': canvas_access_token}
a = AssignmentGenerator(config, course_id, students[0]['canvas_id'])
result=[]
for student in students:
    canvas_id = student['canvas_id']
    name = student['name']
    a.set_student_id(canvas_id)
    assignments = a.create_and_save_assignments()
    result.append(assignments)
print(len(result))