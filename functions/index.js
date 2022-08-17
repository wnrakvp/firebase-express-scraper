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

exports.addToDB = functions.https.onRequest((req, res) => {
  const admin = require('firebase-admin');
  if (initApp === 0) {
    admin.initializeApp();
    initApp = 1;
  }
  // Mockup Scraper Website
  axios
      .get('http://localhost:5001/dev-adapter-353805/us-central1/scrapeWebsite')
      .then((response) => {
        const db = admin.firestore();
        db.collection('BRAND')
            .doc('products')
            .set(response.data)
            .then((response) => {
              return res
                  .status(200)
                  .json({msg: 'Added Successfully', data: response});
            })
            .catch((err) => {
              // console.error(err);
              throw new Error(err);
            });
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).json({msg: 'Internal Server Error'});
      });
});

exports.scrapeWebsite = functions.https.onRequest(async (req, res) => {
  const puppeteer = require('puppeteer');
  const {Cluster} = require('puppeteer-cluster');
  console.time('Scraping Service');
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--disable-gpu', // GPU hardware acceleration
      '--Disable-dev-shm-usage', // Create temporary file shared memory
      '--Disable-setuid-sandbox', // uid sandbox
      // "–No-first-run",
      // No home page is set. At startup, a blank page will open.
      '--single-process', // Single process run
      '--no-zygote',
      '--no-sandbox', // sandbox mode
    ],
    // executablePath: '/usr/bin/google-chrome',
  });
  const page = await browser.newPage();
  // const blocked_domains = [
  //   'googlesyndication.com',
  //   'adservice.google.com',
  // ];
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.resourceType() === 'document') request.continue();
    else request.abort();
  }),
  await page.goto('https://store.brandsworld.co.th/%E0%B8%9C%E0%B8%A5%E0%B8%B4%E0%B8%95%E0%B8%A0%E0%B8%B1%E0%B8%93%E0%B8%91%E0%B9%8C%E0%B9%81%E0%B8%9A%E0%B8%A3%E0%B8%99%E0%B8%94%E0%B9%8C/c/1?q=%3Arelevance&show=All');
  const urls = await page.$$eval(
      'body > main > div.container > div.row > div > ul > li > a',
      (as) => {
        return as.map((a) => a.href);
      }
  );
  await browser.close();
  // Get All Urls of Products
  const dl = {};
  // Get ALl Details of Product in parallel.
  // Puppeteer - Cluster
  console.time('Lauching Puppeteer-Cluster');
  const cluster = await Cluster.launch({
    puppeteer,
    puppeteerOptions: {
      headless: true,
      args: [
        '--disable-gpu', // GPU hardware acceleration
        '--Disable-dev-shm-usage', // Create temporary file shared memory
        '--Disable-setuid-sandbox', // uid sandbox
        '–No-first-run',
        // No home page is set. At startup, a blank page will open.
        '--single-process', // Single process run
        '--no-zygote',
        '--no-sandbox', // sandbox mode
      ],
      // executablePath: '/usr/bin/google-chrome',
    },
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 5,
    monitor: true,
  });

  // Define a task
  await cluster.task(async ({page, data: url}) => {
    await Promise.all([
      page.setRequestInterception(true),
      page.on('request', (request) => {
        if (request.resourceType() === 'document') request.continue();
        else request.abort();
      }),
      page.goto(url),
      page.waitForNavigation({waitUntil: ['domcontentloaded']}),
    ]);
    const result = await page.evaluate('dataLayer');
    dl.push(result[1]);
  });

  // Loop all of urls
  for (const url of urls) {
    cluster.queue(url);
  }

  // In case of problems, retry and if failed, log them
  cluster.on('taskerror', (err, data, willRetry) => {
    if (willRetry) {
      console.warn(
          `Facing an error ${data}.${err.message}\nThis job will be retried.`
      );
    } else {
      console.error(`Failed to crawl ${data}: ${err.message}`);
    }
  });
  await cluster.idle();
  await cluster.close();
  console.timeEnd('Lauching Puppeteer-Cluster');
  console.timeEnd('Scraping Service');
  return res.status(200).json({dl});
});

exports.FacebookCatalogTrigger = functions.firestore
    .document('BRAND/products')
    .onWrite((change, context) => {
      const differences = detailedDiff(
          change.before.data(),
          change.after.data()
      );
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
        for (const [key] of Object.entries(differences.deleted)) {
          requests.push({
            method: 'DELETE',
            data: {
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
      return console.log(requests);
      // Cool Beans Long-lived Page Token
      // const accessToken = process.env.ACCESS_TOKEN;
      // const catalogId = process.env.CATALOG_ID;
      // const apiVersion = process.env.API_VERSION;
      // const url = `https://graph.facebook.com/${apiVersion}/${catalogId}/items_batch`;
      // const payload = {
      //   access_token: accessToken,
      //   item_type: 'PRODUCT_ITEM',
      //   requests,
      // };
      // return axios
      //     .post(url, payload)
      //     .then((response) => {
      //       console.log(response);
      //     })
      //     .catch((err) => {
      //       console.log(err);
      //     });
    });

// exports.GoogleCatalogTrigger = functions.firestore
//     .document('BRAND/products')
//     .onWrite(async (change, context) => {
//       const content = require('@googleapis/content');
//       const auth = new content.auth.GoogleAuth({
//         keyFile: './config/service-account/content_api.json',
//         scopes: 'https://www.googleapis.com/auth/content',
//       });
//       const authClient = await auth.getClient();
//       const client = await content.content({
//         version: 'v2.1',
//         auth: authClient,
//       });
//       const response = await client.products.list({
//         merchantId: process.env.MERCHANT_ID,
//       });
//       const differences = detailedDiff(
//           change.before.data(),
//           change.after.data()
//       );
//       // const requests = [];
//       console.log(differences);
//       console.log(response);
//     });
