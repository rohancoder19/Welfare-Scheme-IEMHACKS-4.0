const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Scheme = require('../models/Scheme');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civic_welfare_db';

async function importSchemes() {
  try {
    const jsonPath = path.join(__dirname, '..', '..', 'ml_service', 'data', 'processed_welfare_schemes.json');
    if (!fs.existsSync(jsonPath)) {
      console.error(`Processed schemes file not found at: ${jsonPath}`);
      process.exit(1);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const schemesData = JSON.parse(rawData);

    console.log(`Loaded ${schemesData.length} processed schemes from JSON. Connecting to MongoDB...`);
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 4000 });
      console.log('Connected to Primary MongoDB URI.');
    } catch (err) {
      console.warn('Primary MongoDB URI failed. Attempting local MongoDB connection (mongodb://127.0.0.1:27017/civic_welfare_db)...');
      await mongoose.connect('mongodb://127.0.0.1:27017/civic_welfare_db');
      console.log('Connected to Local MongoDB.');
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < schemesData.length; i++) {
      const item = schemesData[i];
      const slug = item.slug || `scheme_${i + 1}`;

      const updateDoc = {
        schemeName: item.schemeName,
        slug: slug,
        category: item.schemeCategory || 'General Welfare',
        schemeCategory: item.schemeCategory || 'General Welfare',
        description: item.details || item.schemeName,
        details: item.details || '',
        benefits: item.benefits || 'Welfare benefits',
        eligibilityText: item.eligibilityText || '',
        application: item.application || '',
        documents: item.documents || '',
        governmentLevel: item.governmentLevel || 'State',
        state: item.state || 'All India',
        tags: item.tags || [],
        eligibilityCriteria: item.eligibilityCriteria || {},
        extractionMetadata: item.extractionMetadata || {}
      };

      const result = await Scheme.updateOne(
        { slug: slug },
        { $set: updateDoc },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        insertedCount++;
      } else {
        updatedCount++;
      }
    }

    const totalInDb = await Scheme.countDocuments();
    console.log(`\nImport Completed Successfully:`);
    console.log(`- Upserted New Schemes : ${insertedCount}`);
    console.log(`- Updated Existing     : ${updatedCount}`);
    console.log(`- Total MongoDB Schemes: ${totalInDb}\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Import schemes error:', error);
    process.exit(1);
  }
}

importSchemes();
