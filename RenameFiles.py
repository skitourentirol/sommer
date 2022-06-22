#Rename GPX Tracks in Folder

import os
path = "C:\VertiGIS\Uni\Webmapping\skitouren.github.io\data\Radtouren"
os.chdir(path)
files = os.listdir(path)


for index, file in enumerate(files):
    os.rename(os.path.join(path, file), os.path.join(path, ''.join([str(index), '.gpx'])))