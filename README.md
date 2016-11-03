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

### Deploying

If you use AWS S3, you can provide an aws-credentials.json, point
`aws-upload.conf.js` to your s3 bucket and run `s3upload` to copy the
built `dist/` directory to your bucket.