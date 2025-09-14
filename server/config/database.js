const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Enhanced connection options for MongoDB Atlas and local connections
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    // Support for MongoDB Atlas cloud connections
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_budget_tracker';
    
    // Log connection attempt (without exposing credentials)
    const sanitizedURI = mongoURI.replace(/(mongodb(?:\+srv)?:\/\/)([^:]*):([^@]*)@/, '$1***:***@');
    console.log(`Attempting to connect to MongoDB: ${sanitizedURI}`);

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.name}`);
    console.log(`⚡ Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected successfully');
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Enhanced error reporting for common connection issues
    if (error.message.includes('authentication failed')) {
      console.error('🔐 Authentication Error: Please check your MongoDB username and password');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🌐 Network Error: Please check your MongoDB connection string and network connectivity');
    } else if (error.message.includes('MongoServerSelectionError')) {
      console.error('🖥️  Server Selection Error: Unable to connect to MongoDB server. Check if MongoDB is running.');
    }
    
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (msg, callback) => {
  mongoose.connection.close(() => {
    console.log(`🛑 MongoDB connection closed through ${msg}`);
    callback();
  });
};

// Close connection when app terminates
process.once('SIGUSR2', () => {
  gracefulShutdown('nodemon restart', () => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

process.on('SIGINT', () => {
  gracefulShutdown('app termination', () => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  gracefulShutdown('Heroku app shutdown', () => {
    process.exit(0);
  });
});

module.exports = connectDB;