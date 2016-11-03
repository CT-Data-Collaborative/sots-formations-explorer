# SOTS Business Formation Activity Viewer

### Getting started

First install the local node dependencies which we need for managing serving, sass compilation
and building the final app.js file

```npm install``` will do the trick

There are a few basic gulp commands specified for getting started.

```gulp``` will move external dependencies from the node_modules 
directory, build/compile the angular and sass files respectively and 
will launch the a local dev server availablne at ```localhost:4444``` 
or ```0.0.0.0:4444```.


### Data

Data files should be populated in the `src/static/data` directory. Data 
files are copied in using an external tool and should not be committed 
to the repo.

### Deploying

If you use AWS S3 and you have the s3 CLI tools installed you can deploy
with `aws s3 sync dist/ s3://bucket`