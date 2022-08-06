const admin = require('firebase-admin');
const functions = require('firebase-functions');
const {detailedDiff} = require('deep-object-diff');
const axios = require('axios');
// const connectDB = require('./config/connectDB');
// const serviceAccount = require('./config/service-account/database.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL:
//     'https://dev-adapter-353805-default-rtdb.asia-southeast1.firebasedatabase.app',
// });

// ---------------- USE FOR DEVELOPMENT PURPOSE --------------------------------
admin.initializeApp();
// ---------------- USE FOR DEVELOPMENT PURPOSE --------------------------------

exports.getProduct = functions.https.onRequest((req, res) => {
  try {
    // const ref = await connectDB(admin, 'testDB');
    const db = admin.database();
    const ref = db.ref();
    ref.on(
        'value',
        (snapshot) => {
          functions.logger.info(snapshot.val(), {structuredData: true});
          return res.status(200).json(snapshot.val());
        },
        (errorObject) => {
          console.log('The read failed: ' + errorObject.name);
          throw new Error('Cannot Read Data.');
        }
    );
  } catch (e) {
    console.log(e.message);
    return res.status(500).json({msg: 'Internal Server Error'});
  }
});

exports.FacebookCatalogTrigger = functions.database
    // .instance('dev-adapter-353805')
    .ref()
    .onWrite((change, context) => {
      const differences = detailedDiff(
          change.before.val(),
          change.after.val()
      );
      const requests = [];
      console.log(Object.keys(differences.updated.products));
      console.log(Object.values(differences.updated.products));
      // id.forEach((id)=> {
      requests.push({
        method: 'UPDATE',
        data: {
          id: Object.keys(differences.updated.products)[0],
          title: 'แบรนด์ วีไลค์ ซุปไก่สกัด 42 มล.',
          description: 'Test',
          condition: 'new',
          link: 'https://www.google.co.th',
          availability: 'out of stock',
          price: '2000 THB',
          image_link: 'https://www.google.co.th',
          brand: 'Brand',
        },
      });
      console.log(requests);
      // Cool Beans Long-lived Page Token
      const accessToken = 'EAAECdwZBqHzEBAHaivpSFBMoQZBBWv1McHe9BcOluFNMthzf2zozFJmFAt57gNvwFaNHojLFvSK3nexhATlUifz1ZBxLXH90jPKYqwGZADtTohyFG589pUSevAEjwh0I8QFGrMjBfwWLAqQsthkKT8jWOH5gSh5F7c7sTkRNV8YmrRGuu1yPnMLVDIhr7yjJUQND3iOT1wZDZD';
      const catalogId = '3256983894625954'; // Cool Beans Catalog ID
      const apiVersion = 'v14.0';

      const url = `https://graph.facebook.com/${apiVersion}/${catalogId}/items_batch`;
      const payload = {
        accessToken,
        item_type: 'PRODUCT_ITEM',
        requests,
      };
      const result = axios.post(url, payload)
          .then((response) => console.log(response))
          .catch((err)=>console.error(err));
      // functions.logger.info(differences);
      return result;
    });

// exports.GoogleCatalogTrigger = functions.database
//   // .instance('dev-adapter-353805')
//   .ref()
//   .onDelete((snapshot, context) => {
//     functions.logger.info(snapshot.val());
//     return snapshot.val();
//   });
