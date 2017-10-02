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

### Deployment

1. From the ctdata-sots-formations folder run `npm install` to load the node packages
2. Run `gulp build` <sup>1</sup>
3. Run `aws s3 sync dist/ s3://ctbusiness.ctdata.org`


<sup>1</sup> This may not work if gulp is not installed, run `npm install -g gulp` (may need sudo) to install gulp. Another reason it may not work is you do not have enough space, run `docker images` to see what you have running, determine if the larger images can be deleted, run `docker rmi [IMAGE ID]` to remove
