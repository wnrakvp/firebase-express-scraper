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
