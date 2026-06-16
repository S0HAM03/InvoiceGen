const fs = require('fs');
const https = require('https');

const API_KEY = 'YOUR_POSTMAN_API_KEY_HERE';

// 1. Get workspaces to find 'InvoiceGen'
const getWorkspaces = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.getpostman.com',
      path: '/workspaces',
      method: 'GET',
      headers: { 'X-Api-Key': API_KEY }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
};

// 2. Get all collections to check for existing one
const getCollections = (workspaceId) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.getpostman.com',
      path: `/collections?workspace=${workspaceId}`,
      method: 'GET',
      headers: { 'X-Api-Key': API_KEY }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
};

// 3. Create a new collection
const createCollection = (workspaceId, collectionData) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ collection: collectionData });
    const options = {
      hostname: 'api.getpostman.com',
      path: `/collections?workspace=${workspaceId}`,
      method: 'POST',
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

// 4. Update an existing collection
const updateCollection = (collectionUid, collectionData) => {
  return new Promise((resolve, reject) => {
    // Postman expects ID to not be sent in the request body for updates to avoid mismatches
    delete collectionData.info._postman_id;
    
    const postData = JSON.stringify({ collection: collectionData });
    const options = {
      hostname: 'api.getpostman.com',
      path: `/collections/${collectionUid}`,
      method: 'PUT',
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

const run = async () => {
  try {
    console.log('Fetching workspaces...');
    const wsData = await getWorkspaces();
    const workspaces = wsData.workspaces || [];
    
    let targetWs = workspaces.find(w => w.name.toLowerCase().includes('invoicegen')) || workspaces[0];
    if (!targetWs) {
      console.log('No workspaces found!');
      return;
    }
    
    console.log(`Using workspace: ${targetWs.name} (${targetWs.id})`);
    
    const collectionJson = JSON.parse(fs.readFileSync(__dirname + '/complete_collection.json', 'utf8'));
    const collectionName = collectionJson.info.name;

    console.log('Fetching existing collections...');
    const collectionsData = await getCollections(targetWs.id);
    const collections = collectionsData.collections || [];

    // Find the existing collection by name to avoid duplicates
    const existingCollection = collections.find(c => c.name === collectionName);

    if (existingCollection) {
      console.log(`Found existing collection "${collectionName}" (uid: ${existingCollection.uid}). Updating...`);
      const result = await updateCollection(existingCollection.uid, collectionJson);
      console.log('Update result:', result?.collection ? 'Success' : result);
    } else {
      console.log(`Collection "${collectionName}" not found. Creating new...`);
      const result = await createCollection(targetWs.id, collectionJson);
      console.log('Create result:', result?.collection ? 'Success' : result);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

run();
