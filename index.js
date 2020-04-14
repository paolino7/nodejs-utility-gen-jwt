/**
 * Nodejs utility implementing Salesforce JWT flow
 * ref. https://help.salesforce.com/articleView?id=remoteaccess_oauth_jwt_flow.htm&type=5
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const moment = require('moment');
const colors = require('colors');
const axios = require('axios').default;
const qs = require('querystring');
const dotenv = require('dotenv');
dotenv.config();

const privateKey = fs.readFileSync('./asset/private.key');
const expDate = moment().unix();

const jwtPayload = {
    iss: process.env.CLIENT_ID,
    aud: process.env.SFDC_AUDIENCE,
    sub: process.env.SFDC_USERNAME,
    exp: expDate
};

console.log(`Load all variables for generate JWT payload: ${JSON.stringify(jwtPayload)}`);

const token = jwt.sign(jwtPayload, privateKey, { algorithm: 'RS256' });

//console.log(`DONE!`);
//console.log(token);

const postBody = qs.stringify({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: token
});

const uri = process.env.SFDC_URL + '/services/oauth2/token';
axios.post(uri, postBody, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).then(response => {
    console.log(`Status ${response.status} - ${JSON.stringify(response.data)}`.green);
    const {access_token, sfdc_community_url, sfdc_community_id, scope, instance_url, id, token_type} = response.data;

    console.log(access_token);

    const authHeader = `Bearer ${access_token}`;

    axios.get(id, {headers: {'Authorization' : authHeader}}).then(response => {
        console.log(`Status ${response.status} - ${JSON.stringify(response.data)}`.green);

        console.log(`User ${response.data.username} - ${response.data.user_id} is a ${response.data.user_type} user`.bgYellow.bold);
    }).catch(e => {
        console.error(`Status ${e.response.status} - ${JSON.stringify(e.response.data)}`.red);
    });
}).catch(e => {
    console.error(`Status ${e.response.status} - ${JSON.stringify(e.response.data)}`.red);
});