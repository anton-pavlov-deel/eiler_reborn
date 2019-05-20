import sys
import numpy as np

size = int(sys.argv[1]);
vertices = eval(sys.argv[2]);
matrix = np.zeros((size, size));
maxEigenValue = -1;
maxEigenVector = [];

for i in range(len(vertices)):
    for target in vertices[i]:
        matrix[i][target] = 1.;

eigenValues, eigenVectors = np.linalg.eig(matrix);

for i in range(len(eigenValues)):
    if (eigenValues[i] > maxEigenValue):
        maxEigenValue = eigenValues[i];
        maxEigenVector = eigenVectors[i];

formattedEigenVector = [];

for value in maxEigenVector:
    formattedEigenVector.append(float(value));

print(float(maxEigenValue));
print(formattedEigenVector);
