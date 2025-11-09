import { MongoClient, MongoClientOptions } from 'mongodb';

// Check for required environment variables
if (!process.env.MONGODB_URL) {
  throw new Error('Please define the MONGODB_URL environment variable');
}

// Get environment variables
const url = process.env.MONGODB_URL;
const username = process.env.MONGODB_USERNAME || '';
const password = process.env.MONGODB_PASSWORD || '';

// Construct the MongoDB connection URI
let uri: string;

// Extract host and port from URL
let hostPart: string;
if (url.startsWith('mongodb://') || url.startsWith('mongodb+srv://')) {
  if (url.includes('@')) {
    // URL already has auth info, extract the host part
    hostPart = url.split('@')[1];
  } else {
    // Remove mongodb:// prefix if present
    hostPart = url.replace(/^mongodb:\/\//, '');
  }
} else {
  // It's just a hostname or IP address
  hostPart = url;
}

// Remove any trailing path or query params from host
hostPart = hostPart.split('/')[0].split('?')[0];

// Construct the final URL with authSource=admin (matching Python backend)
if (username && password) {
  uri = `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${hostPart}/?authSource=admin`;
} else {
  uri = `mongodb://${hostPart}/`;
}

// Connection options matching Python backend
const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 60000,
  socketTimeoutMS: 60000,
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
