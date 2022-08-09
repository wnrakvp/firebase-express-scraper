// At the top of test/index.test.js
const test = require('firebase-functions-test')(
    {
      apiKey: 'AIzaSyCMao9ZHs_NOGVk6Itb5WSt1JAXGYFyAb0',
      authDomain: 'dev-adapter-353805.firebaseapp.com',
      databaseURL:
        'https://dev-adapter-353805-default-rtdb.asia-southeast1.firebasedatabase.app',
      projectId: 'dev-adapter-353805',
      storageBucket: 'dev-adapter-353805.appspot.com',
      messagingSenderId: '286156288382',
      appId: '1:286156288382:web:e4472942ca2865378a832f',
      measurementId: 'G-QCNN9QG0E3',
    },
    './config/service-account/firebase_service.json'
);

const myFunction = require('../index');
// Make snapshot for state of database beforehand
const beforeSnap = test.database.makeDataSnapshot({foo: 'bar'}, 'document/path');
// Make snapshot for state of database after the change
const afterSnap = test.database.makeDataSnapshot({foo: 'faz'}, 'document/path');
const change = test.makeChange(beforeSnap, afterSnap);
// Call wrapped function with the Change object
const wrapped = test.wrap(myFunction.FacebookCatalogTrigger);
wrapped(change);

// Mock functions config values
test.mockConfig({stripe: {key: '23wr42ewr34'}});
