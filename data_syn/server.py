# from flask import Flask, request, jsonify
# import subprocess
# import os

# app = Flask(__name__)

# @app.route('/run-python-script', methods=['POST'])
# def run_python_script():
#     data = request.json
#     email = data['email']
#     password = data['password']
#     download_path = data['download_path']
#     chromedriver_path = data['chromedriver_path']

#     try:
#         # Run your Python script with the arguments
#         subprocess.run(['python', 'gradescope_download.py',
#                         email, password, download_path, chromedriver_path], check=True)
#         return jsonify({"success": True, "message": "CSV downloaded successfully"})
#     except subprocess.CalledProcessError as e:
#         return jsonify({"success": False, "message": str(e)}), 500

# if __name__ == '__main__':
#     app.run(debug=True)


from flask import Flask, jsonify
import subprocess
from flask_cors import CORS

app = Flask(__name__)
# Allow CORS requests to this Flask app from any origin
CORS(app)

@app.route('/run-python-script', methods=['POST'])
def run_python_script():
    try:
        # Run your Python script
        subprocess.run(['python3', 'data_syn/gradescope_download.py'], check=True)
        return jsonify({"success": True, "message": "Python script executed successfully"})
    except subprocess.CalledProcessError as e:
        return jsonify({"success": False, "message": "Python script execution failed"}), 500

if __name__ == '__main__':
    app.run(debug=True)
