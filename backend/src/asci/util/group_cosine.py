import csv

import pandas as pd
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


#READ IN DATA FROM STANDARD INPUT, ONE STRING ENTRY PER LINE
dataIn = []

id = 0
while True:
    row = input()
    
    #quit when we see a -1
    if row == "-1":
        break

    #if len(row.split(" ")) > 4:
    dataIn.append([id, row.lower().replace(".","")])
    id=id+1


df = pd.DataFrame(columns=["ID","DESCRIPTION"], data=np.matrix(dataIn))

corpus = list(df["DESCRIPTION"].values)

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(corpus)

threshold = 0.4


matches = []
for x in range(1,X.shape[0]):
    if(cosine_similarity(X[0],X[x])>=threshold):
      #print("\"" + corpus[0] + "\",\"" + corpus[x] + "\"," + str(cosine_similarity(X[0],X[x])),"<br>")
      matches.append(x)

ret = ""
if len(matches) > 0:
    for i in range(0, len(matches)-1):
        ret += str(matches[i]) + "##"
    ret += str(matches[len(matches)-1])

print(ret, end="")





