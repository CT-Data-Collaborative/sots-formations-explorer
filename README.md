# SOTS Business Formation Activity Viewer

### Getting started and developing

This is an Angular 1.0 application, which depends on Node.js compiling files locally.

Install the dependencies for managing sass compilation, minification, building the final app.js file, and serving
the application by running `npm install`.

The application uses gulp tasks.

```gulp``` will move external dependencies from the node_modules
directory, build/compile the angular and sass files respectively and
will launch the a local dev server available at ```localhost:4444``` 
or ```0.0.0.0:4444```.

Review the `gulpfile.js` to see other defined tasks that can be run individually.

### Data

Data for the formation portal is generated using the
[ctdata-sots-cli](https://github.com/CT-Data-Collaborative/ctdata-sots-cli) tools.

Data files should be copied to the `src/static/data` directory and should *NOT* be committed to the repo (they are large)

### Setup Instructions

1. Clone the following two repos locally:

[ctdata-sots-formations-data-processing](https://github.com/CT-Data-Collaborative/ctdata-sots-formations-data-processing)

[ctdata-sots-formations](https://github.com/CT-Data-Collaborative/ctdata-sots-formations)

2. Add three sub-folders to the 'ctdata-sots-formations-data-processing' folder:
 - final
 - json
 - extracts
 
*Make sure you have the monthly_rebuilds/formations/9_2017 folders set up before you launch these commands* where 9_2017 corresponds to this month's data

### Data Processing

1. cd to 'monthly_rebuilds', run following commands:

```sots extract_formations --dbhost 0.0.0.0 --dbport 5432 --dbuser sots --dbpass [password] -q Address -o formations/9_2017/addresses.csv```

```sots extract_formations --dbhost 0.0.0.0 --dbport 5432 --dbuser sots --dbpass [password] -q Formations -o formations/9_2017/formations.csv```

2. copy the addresses.csv and formations.csv files into the 
'ctdata-sots-formations-data-processing/extracts/09_28_2017' folder

*Make sure you have these sub-folders set up* 

'ctdata-sots-formations-data-processing/final/09_28_2017/types' where 09_28_2017 corresponds to this month's data

3. Open the Rproj from the 'ctdata-sots-formations-data-processing' folder

4. Edit the 'process-sql-extracts.R' file with the correct Month variable, set it equal to your date sub-folder name in the 'ctdata-sots-formations-data-processing' folder

5. Run the 'process-sql-extracts.R' file to create the 'data.csv' file and the sub-folders with all the types csvs

6. Run the python command to convert the csvs to jsons from the 'ctdata-sots-formations-data-processing' folder

```python2 convert_to_json.py -i final/09_28_2017/types -o json/09_28_2017/ -c```

7. Create a `data` subfolder in the src/static folder

8. Copy json files into 'src/static/data'

### Deployment

1. From the ctdata-sots-formations folder run `npm install` to load the node packages
2. Run `gulp build` *
3. Run `aws s3 sync dist/ s3://ctbusiness.ctdata.org`


* This may not work if gulp is not installed, run `npm install -g gulp` (may need sudo) to install gulp. Another reason it may not work is you do not have enough space, run `docker images` to see what you have running, determine if the larger images can be deleted, run `docker rmi [IMAGE ID]` to remove
