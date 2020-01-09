const express = require("express");
const { MongoClient } = require("mongodb");
const app = express();

async function main() {
  const uri =
    "mongodb+srv://Saurabh:<Password>@freecluster-hlxpp.mongodb.net/test?retryWrites=true&w=majority";
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  try {
    await client.connect();
    console.log("Database Connected");
    await findListingWithMinBedroomsMinBathroomsAndMostRecentReviews(client, {
      minimumNumberOfBedrooms: 3,
      minimumNumberOfBathrooms: 1,
      maximumNumberOfResults: 5
    });
    await findOneListingByName(client, "Infinite Views");
  } catch (e) {
    console.log(e);
  } finally {
    await client.close();
  }
}

main().catch(console.err);

async function listDatabases(client) {
  const databaseList = await client
    .db()
    .admin()
    .listDatabases();
  console.log("Databases : ");
  databaseList.databases.forEach(db => console.log(` - ${db.name}`));
}

async function createlisting(client, newlisting) {
  const result = await client
    .db("sample_airbnb")
    .collection("listingsAndReviews")
    .insertOne(newlisting);
  console.log(
    `New listing created with the following id: ${result.insertedId}`
  );
}

async function createMultipleListing(client, newListing) {
  const result = await client
    .db("sample_airbnb")
    .collection("listingsAndReviews")
    .insertMany(newListing);
  console.log(
    `${result.insertedCount} new listing created with th following id(s):`
  );
  console.log(result.insertedIds);
}

async function findOneListingByName(client, nameOfListing) {
  const result = await client
    .db("sample_airbnb")
    .collection("listingsAndReviews")
    .findOne({ name: nameOfListing });
  if (result) {
    console.log(
      `Found Listing in collection with the name '${nameOfListing}':`
    );
    console.log(result);
  } else {
    console.log(
      `No Listing Found in collection with the name '${nameOfListing}'.`
    );
  }
}

async function findListingWithMinBedroomsMinBathroomsAndMostRecentReviews(
  client,
  {
    minimumNumberOfBedrooms = 0,
    minimumNumberOfBathrooms = 0,
    maximumNumberOfResults = Number.MAX_SAFE_INTEGER
  } = {}
) {
  const cursor = client
    .db("sample_airbnb")
    .collection("listingsAndReviews")
    .find({
      bedrooms: { $gte: minimumNumberOfBedrooms },
      bathrooms: { $gte: minimumNumberOfBedrooms }
    })
    .sort({ last_review: -1 })
    .limit(maximumNumberOfResults);

  const results = await cursor.toArray();

  if (results.length > 0) {
    console.log(
      `Found Lisiting(s) with at least ${minimumNumberOfBedrooms} Bedrooms and  ${minimumNumberOfBathrooms} Bathrooms`
    );
    results.forEach((result, i) => {
      date = new Date(result.last_review).toDateString();

      console.log();
      console.log(`${i + 1}. name ${result.name}`);
      console.log(`   _id:${result._id}`);
      console.log(`   bedrooms:${result.bedrooms}`);
      console.log(`   bathrooms:${result.bathrooms}`);
      console.log(
        `   most recent review date:${new Date(
          result.last_review
        ).toDateString()}`
      );
    });
  } else {
    console.log("No Lisiting Found");
  }
}

async function updateListingByName(client, listingName, updateValues) {
  const results = await client
    .db("sample_airbnb")
    .collection("listingsAndReviews")
    .updateOne({ name: listingName }, { $set: updateValues });
  console.log(
    `${results.matchedCount} documents(s) matched the query criteria`
  );
  console.log(`${results.modifiedCount} documents(s) was/were updated`);
}

async function upsertListingByName(client, listingName, updateValues) {
  const result = await client
    .db("sample_airbnb")
    .collection("listingsAndReviews")
    .updateOne({ name: listingName }, { $set: updateValues }, { upsert: true });
  console.log(`${result.matchedCount} documents(s) matched the query criteria`);
  if (result.upsertedCount > 0) {
    console.log(`One document was inserted with id ${result.upsertedId._id}`);
  } else {
    console.log(`${result.modifiedCount} documents(s) was/were updated`);
  }
}

async function updateAllListingByPropertyType(client) {
  const result = await client
    .db("sample_airbnb")
    .collection("listingsAndReviews")
    .updateMany(
      { property_type: "UnKnown" },
      { $set: { property_type: "Unknown" } }
    );
  console.log(`${result.matchedCount} documents(s) matched the query criteria`);
  console.log(`${result.modifiedCount} documents(s) was/were updated`);
}

async function deleteListingByName(client, listingName) {
  const result = await client
    .db("sample_airbnb")
    .collection("listingsAndReviews")
    .deleteOne({ name: listingName });
  console.log(`${result.deletedCount} documents(s) was/were deleted`);
}

async function deleteListingsScrapedBeforeDate(client, date) {
  const result = await client
    .db("sample_airbnb")
    .collection("listingsAndReviews")
    .deleteMany({ last_scraped: { $lt: date } });
  console.log(`${result.deletedCount} documents(s) was/were deleted`);
}

app.listen(5000);
