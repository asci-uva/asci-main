from sentence_transformers import SentenceTransformer, util
import json
import argparse
import pandas as pd
import os

os.environ['SENTENCE_TRANSFORMERS_HOME'] = './.cache'

argParser = argparse.ArgumentParser()
argParser.add_argument("-c", "--create", help="create embeddings csv file")
argParser.add_argument("-a", "--ask", help="ask question")

args = argParser.parse_args()

ACCURACY_MIN = 0.80
MODEL = SentenceTransformer('multi-qa-MiniLM-L6-dot-v1')

if args.create:
    df = pd.read_csv(args.create)
    if os.path.exists('/opt/src/embeddings.csv'):
        os.remove('/opt/src/embeddings.csv')

    embeddings = []
    for question in df["question"]:
        embeddings.append(question)
    df['embeddings'] = MODEL.encode(embeddings).tolist()
    df.to_csv('/opt/src/embeddings.csv', index=False)

else:
    if not os.path.exists('/opt/src/embeddings.csv'):
        raise Exception("embeddings.csv does not exist")

    df = pd.read_csv('/opt/src/embeddings.csv')
    question = MODEL.encode(args.ask)
    posts = []
    most = None
    most_acc = 0

    for i in df.index:
        accuracy = util.pytorch_cos_sim(question, list(
            map(float, df['embeddings'][i].strip('][').split(', '))))
        p = [int(df['id'][i]), str(df['question'][i]), str(df['answer'][i])]
        if accuracy >= ACCURACY_MIN:
            posts.append(p)
        if not most or accuracy > most_acc:
            most = p
            most_acc = accuracy

    if posts:
        D = {
            "posts": posts,
            "accuracy": "true"
        }
        print(json.dumps(D))
    else:
        D = {
            "posts": [most],
            "accuracy": "false"
        }
        print(json.dumps(D))
