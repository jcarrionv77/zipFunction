
const sdk = require('@salesforce/salesforce-sdk');
var JSZip = require("jszip-sync");
const axios = require('axios');
var fs = require('fs');


/**
 * Describe ZipFunction here.
 *
 * The exported method is the entry point for your code when the function is invoked. 
 *
 * Following parameters are pre-configured and provided to your function on execution: 
 * @param {import("@salesforce/salesforce-sdk").InvocationEvent} event:   represents the data associated with the occurrence of an event, and  
 *                 supporting metadata about the source of that occurrence.
 * @param {import("@salesforce/salesforce-sdk").Context} context: represents the connection to Evergreen and your Salesforce org.
 * @param {import("@salesforce/salesforce-sdk").Logger} logger:  logging handler used to capture application logs and traces specific  
 *                 to a given execution of a function.
 */
module.exports = async function (event, context, logger) {



	async function downloadImage (url, path, access_token) {

		logger.info('downloadImage ');

		try
		{
				  // axios image download with response type "stream"
		  const response = await axios({
		    method: 'GET',
		    url: url,
		    responseType: 'stream',
		    headers: {
		   		Authorization: 'Bearer ' + access_token     
		    }

		  });

		  // pipe the result stream into a file on disc
		  response.data.pipe(fs.createWriteStream(path));

		  // return a promise and resolve when download finishes
		  return new Promise((resolve, reject) => {
		    response.data.on('end', () => {
		      resolve()
		    });

		    response.data.on('error', () => {
		      reject()
			    })
			  });

		}
		catch(e)
		{
			logger.info("entering catch block");
			logger.info(e);
			logger.info("leaving catch block");
		}


	}

	var payload = event.data;
	var cvId = payload.contentVersionId;

    logger.info(`Invoking ZipFunction with payload ${JSON.stringify(event.data || {})}`);

    logger.info(context.org.baseUrl);

    logger.info(JSON.stringify(context.org.data.connConfig));
    logger.info(JSON.stringify(context.org.data.user));

    const resQ = await context.org.data.query('SELECT Id, Name FROM Account');
    logger.info(JSON.stringify(resQ));

	const resQ2 = await context.org.data.query('SELECT Id,ContentDocumentId, ContentDocument.FileExtension, ContentDocument.Title   FROM ContentVersion');
    logger.info(JSON.stringify(resQ2));

    const apiCall = await  context.org.request('GET','/services/data/v50.0/sobjects/ContentVersion/'+ cvId,'');

    logger.info('respuesta apiCall');

    var title = apiCall.Title;
    var fileExtension = apiCall.FileExtension;
    var contentId = apiCall.ContentDocumentId;
    var nombreFichero = title+'.'+fileExtension;
    var nombreZip = title+'.zip';
    var path = './' + nombreFichero;

    var access_token = context.org.data.connConfig.accessToken;
    var instance_url = context.org.data.connConfig.instanceUrl;
    logger.info(access_token);
    logger.info(instance_url);
    newUrl = instance_url + '/services/data/v50.0/sobjects/ContentVersion/' + cvId + '/VersionData';

    const data = await downloadImage (newUrl, path, access_token);

    logger.info('fichero descargado');

	var a = fs.readFileSync('./'+ nombreFichero);
	var base64data = Buffer.from(a, 'binary').toString('base64');

	logger.info('fichero leido');


	var zip = new JSZip();
	var zipped = zip.sync(function() {
		debugger;
	    // put some stuff in there
	    zip.file("./"+nombreFichero, base64data, {base64: true}); 
	    //zip.file("Hello.txt", "Hello World\n");
	    // call regular async methods
	    var data = null;
	    zip.generateAsync({type: "base64", compression: "DEFLATE"})
	        .then(function(content) {
	            data = content;
	            logger.info('fichero zippeado');
	            }, error => {
			    	console.log('onRejected function called: ' + error.message);
			  	});
	    return data;        
	});

	logger.info('antes de insert');

	const cv = new sdk.SObject('ContentVersion');
	cv.setValue('ContentDocumentId', contentId);
	cv.setValue('PathOnClient', nombreZip);
	cv.setValue('Title', nombreZip);
	cv.setValue('ReasonForChange', 'Compresion via API');
	cv.setValue('VersionData', zipped);

	const results = await context.org.data.insert(cv);
	logger.info('despues de insert');
	logger.info(results);
	
    logger.info('end');

    return "DONE";
}
