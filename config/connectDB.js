const connectDB = (dbName) => {
// Connect To Realtime DB via FirebaseAdminSDK
const admin = require("firebase-admin");
const serviceAccount = require("./service-account/database.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://dev-adapter-353805-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();
const ref = db.ref(dbName);
console.log('Firebase Realtime Database Connected !!');
return ref

}

module.exports = connectDB;


// // const productsRef = ref.child('products');
// ref.on('value', (snapshot) => {
//     console.log(snapshot.val());
//   }, (errorObject) => {
//     console.log('The read failed: ' + errorObject.name);
//   }); 
