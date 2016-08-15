/**
 * Imports
 */
import request from 'request';

/**
 * Script execution handler
 * @param args - required and optional parameters
 */
export default async function handle(args) {
    
    // Validate required parameters
    if (args.length < 2) {
        console.log('Usage: clearImages <api_base_url> <jwt>');
        process.exit(1);
    }
    let apiBaseURL = args[0];
    let jwt = args[1];
    
    // Make request
    console.log('Making request to API');
    request.post({
        url: `${apiBaseURL}/v1/products/upload`,
        json: true,
        formData: {
            resource: 'images',
            action: 'clear'
        },
        headers: {
            'Authorization': jwt
        }
    }, function optionalCallback(err, httpResponse, body) {
        if (err || httpResponse.statusCode != 201) {
            return console.error('Images clear failed:', err, body);
        }
        return console.log('Images clear successful!');
    });
}
