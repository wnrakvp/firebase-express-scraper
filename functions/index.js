const functions = require('firebase-functions');
// const key = functions.config().stripe.key;
const {detailedDiff} = require('deep-object-diff');
const axios = require('axios');
let initApp = 0;
// const connectDB = require('./config/connectDB');
// const serviceAccount = require('./config/service-account/database.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL:
//     'https://dev-adapter-353805-default-rtdb.asia-southeast1.firebasedatabase.app',
// });

exports.getProduct = functions.https.onRequest((req, res) => {
  const admin = require('firebase-admin');
  if (initApp === 0) {
    admin.initializeApp();
    initApp = 1;
  }
  // Mockup Scraper Website
  axios.get('http://localhost:3000/products')
      .then((response) => {
        const db = admin.firestore();
        db.collection('BRAND').doc('products').set(response.data)
            .then((response) => {
              return res.status(200).json({msg: 'Added Successfully',
                data: response});
            })
            .catch((err)=> {
              console.error(err);
              return res.status(500).json({msg: 'Internal Server Error'});
            });
      })
      .catch((err)=> {
        console.log(err);
        return res.status(500).json({msg: 'Internal Server Error'});
      });
  //
  // const ref = await connectDB(admin, 'testDB');
  // const db = admin.firestore();
  // db.collection('BRAND').doc('products').set(customerProduct)
  //     .then((response) => {
  //       return res.status(200).json({msg: 'Added Successfully',
  //         data: response});
  //     })
  //     .catch((err)=> {
  //       console.error(err);
  //       return res.status(500).json({msg: 'Internal Server Error'});
  //     });
});

exports.FacebookCatalogTrigger = functions
    .firestore// .instance('dev-adapter-353805')
    .document('BRAND/products')
    .onWrite((change, context) => {
      const differences = detailedDiff(
          change.before.data(), change.after.data());
      const requests = [];
      // console.log(differences);
      if (Object.keys(differences.added).length !== 0) {
        for (const [key, value] of Object.entries(differences.added)) {
          requests.push({
            method: 'CREATE',
            data: Object.assign(
                {
                  id: key,
                },
                value
            ),
          });
        }
      }
      if (Object.keys(differences.deleted).length !== 0) {
        for (const [key, value] of Object.entries(differences.deleted)) {
          requests.push({
            method: 'DELETE',
            data:
                {
                  id: key,
                },
          });
        }
      }
      if (Object.keys(differences.updated).length !== 0) {
        // const upProducts = [];
        // upProducts.push(differences.updated);
        for (const [key, value] of Object.entries(differences.updated)) {
          requests.push({
            method: 'UPDATE',
            data: Object.assign(
                {
                  id: key,
                },
                value
            ),
          });
        }
      }
      // return console.log(requests);
      // Cool Beans Long-lived Page Token
      const accessToken =
            'EAAECdwZBqHzEBAHaivpSFBMoQZBBWv1McHe9BcOluFNMthzf2zozFJmFAt57gNvwFaNHojLFvSK3nexhATlUifz1ZBxLXH90jPKYqwGZADtTohyFG589pUSevAEjwh0I8QFGrMjBfwWLAqQsthkKT8jWOH5gSh5F7c7sTkRNV8YmrRGuu1yPnMLVDIhr7yjJUQND3iOT1wZDZD';
      const catalogId = '3256983894625954'; // Cool Beans Catalog ID
      const apiVersion = 'v14.0';
      const url = `https://graph.facebook.com/${apiVersion}/${catalogId}/items_batch`;
      const payload = {
        access_token: accessToken,
        item_type: 'PRODUCT_ITEM',
        requests,
      };
      return axios
          .post(url, payload)
          .then((response) => {
            console.log(response);
          })
          .catch((err) => {
            console.log(err);
          });
    });

// exports.GoogleCatalogTrigger = functions.database
//   // .instance('dev-adapter-353805')
//   .ref()
//   .onDelete((snapshot, context) => {
//     functions.logger.info(snapshot.val());
//     return snapshot.val();
//   });
