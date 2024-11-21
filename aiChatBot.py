from flask import Flask, render_template, request, jsonify, send_from_directory
from groq import Groq
from pymongo import MongoClient
import os

app = Flask(__name__, template_folder='C:')  # Change to where HTML is

# Initialize the Groq client
client = Groq(api_key='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')

# MongoDB setup (replace the placeholders with actual details)
mongo_client = MongoClient("mongodb+srv://Scott:81885MuPJIXLieea@cluster0.entpojq.mongodb.net/")
db = mongo_client['StemSpec']  # Access the 'StemSpec' database
job_collection = db['Jobs']  # Access the 'Jobs' collection

# Route for the main page (AI Chat and Job Listings)
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('C:', filename)  # Change to where HTML is

# Route to handle job recommendations using the AI (Unchanged)
@app.route('/get_job_recommendations', methods=['POST'])
def get_job_recommendations():
    data = request.get_json()
    user_input = data.get('user_input', '')

    if not user_input:
        return jsonify({"response": "Please provide a valid input."}), 400

    # Create the Groq prompt
    prompt = f"Provide a brief, real-world example or application of the following concept in 2-3 sentences: {user_input}. The response should be practical, such as how this concept is used in everyday life or in specific industries."

    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-70b-8192",
            max_tokens=100
        )

        response = chat_completion.choices[0].message.content
        sentences = response.split('.')
        short_response = '. '.join(sentences[:2]) + '.'

        return jsonify({"response": short_response})
    except Exception as e:
        return jsonify({"response": f"An error occurred: {str(e)}"}), 500

# Route to search and get job data from MongoDB
@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    query = request.args.get('query', '')  # Job title or related degree
    subject = request.args.get('subject', '')  # Subject filter from the dropdown

    filter_criteria = {}

    if subject:
        # Find topics by the subject
        topics = list(db.Topics.find({'subject': {'$regex': subject, '$options': 'i'}}))  # Case-insensitive query

        if not topics:
            return jsonify({'error': 'No topics found for the given subject'}), 404

        # Collect all related degrees from the matching topics
        related_degrees = []
        for topic in topics:
            related_degrees.extend(topic.get('related_degrees', []))

        # Get real degrees from the DegreeLinks collection
        real_degrees = set()
        for degree in related_degrees:
            degree_link = db.degreeLinks.find_one({'generalDegree': {'$regex': degree, '$options': 'i'}})
            if degree_link and degree_link.get('realDegrees'):
                real_degrees.update(degree_link['realDegrees'])

        # Filter jobs based on these real degrees
        filter_criteria['related_degrees'] = {'$in': list(real_degrees)}

    if query:
        # Search for jobs based on the query (job title, related degrees, etc.)
        filter_criteria = {
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},  # Search job title
                {"related_degrees": {"$regex": query, "$options": "i"}}  # Search related degrees
            ]
        }
    jobs = job_collection.find(filter_criteria)

    job_list = []
    for job in jobs:
        job_list.append({
            'title': job.get('title', ''),
            'salary_range': job.get('salary_range', ''),
            'related_degrees': job.get('related_degrees', ''),
            'entry_reqs': job.get('entry_reqs', ''),
            'related_careers': job.get('related_careers', ''),
            'skills_knowledge': job.get('skills_knowledge', ''),
        })

    return jsonify(job_list)  # Return the jobs list as JSON

# Route to get subjects (generalDegree) from MongoDB
@app.route('/api/subjects', methods=['GET'])
def get_unique_subjects():
    try:
        subjects_cursor = db.Topics.aggregate([
            {"$group": {"_id": "$subject"}},
            {"$project": {"_id": 0, "subject": "$_id"}}
        ])

        subjects = [subject['subject'] for subject in subjects_cursor]

        if not subjects:
            return jsonify({'error': 'No subjects found'}), 404

        # Return the unique subjects as JSON
        return jsonify({'subjects': subjects})

    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500


@app.route('/api/topicDetails', methods=['GET'])
def get_topic_details():
    try:
        subject = request.args.get('subject', '').strip()
        print(f"Received subject: {subject}")

        # Ensure that the subject is valid and not empty
        if not subject:
            return jsonify({'error': 'Subject not provided'}), 400

        topics = list(db.Topics.find({'subject': {'$regex': subject, '$options': 'i'}}))
        print(f"Found topics: {topics}")

        if not topics:
            return jsonify({'error': 'No topics found for the given subject'}), 404

        topic_list = []
        for topic in topics:
            real_degrees = []
            for related_degree in topic.get('related_degrees', []):
                degree_link = db.degreeLinks.find_one({'generalDegree': {'$regex': related_degree, '$options': 'i'}})
                if degree_link and degree_link.get('realDegrees'):
                    real_degrees.extend(degree_link['realDegrees'])


            real_degrees = list(set(real_degrees))

            topic_list.append({
                'subject': topic.get('subject', ''),
                'topic': topic.get('topic', ''),
                'description': topic.get('description', ''),
                'related_degrees': topic.get('related_degrees', []),
                'real_degrees': real_degrees
            })

        return jsonify(topic_list)

    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
