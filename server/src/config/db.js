const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let useMemoryDb = false;
const dbFile = path.join(__dirname, 'mock_db.json');
let memoryDb = {};

if (fs.existsSync(dbFile)) {
  try {
    memoryDb = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  } catch (e) {
    memoryDb = {};
  }
}

const saveDb = () => {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(memoryDb, null, 2), 'utf8');
  } catch (e) {
    console.error('[DB] Failed to save database file:', e.message);
  }
};

const matchesFilter = (doc, filter) => {
  if (!filter) return true;
  for (let key in filter) {
    const val = filter[key];
    if (val && typeof val === 'object') {
      if (val.$gte !== undefined && !(doc[key] >= val.$gte)) return false;
      if (val.$gt !== undefined && !(doc[key] > val.$gt)) return false;
      if (val.$lte !== undefined && !(doc[key] <= val.$lte)) return false;
      if (val.$lt !== undefined && !(doc[key] < val.$lt)) return false;
      if (val.$in !== undefined && (!Array.isArray(val.$in) || !val.$in.includes(doc[key]))) return false;
      continue;
    }
    // Simple equality (converting ObjectIds to strings)
    const docVal = doc[key] && doc[key]._id ? doc[key]._id : doc[key];
    const filterVal = val && val._id ? val._id : val;
    if (docVal != filterVal) {
      if (docVal && filterVal && docVal.toString() === filterVal.toString()) {
        continue;
      }
      return false;
    }
  }
  return true;
};

// Patch Mongoose Model and Query to run locally without crashing when DB is offline
const enableMemoryFallback = () => {
  useMemoryDb = true;
  console.log('[DB] Patching mongoose models to run in offline memory-fallback mode...');

  // Override Model.prototype.save
  mongoose.Model.prototype.save = async function() {
    const modelName = this.constructor.modelName;
    if (!memoryDb[modelName]) memoryDb[modelName] = [];
    
    // Check if it already exists
    const existingIndex = memoryDb[modelName].findIndex(d => d._id.toString() === this._id.toString());
    const docObj = this.toObject();
    
    if (existingIndex > -1) {
      memoryDb[modelName][existingIndex] = docObj;
    } else {
      memoryDb[modelName].push(docObj);
    }
    saveDb();
    return this;
  };

  // Override Model.create
  const originalCreate = mongoose.Model.create;
  mongoose.Model.create = async function(doc, options) {
    if (useMemoryDb) {
      if (Array.isArray(doc)) {
        const instances = doc.map(d => new this(d));
        for (let inst of instances) {
          await inst.save();
        }
        return instances;
      } else {
        const inst = new this(doc);
        await inst.save();
        return inst;
      }
    }
    return originalCreate.apply(this, arguments);
  };

  // Override Query exec
  const originalExec = mongoose.Query.prototype.exec;
  mongoose.Query.prototype.exec = async function() {
    if (useMemoryDb) {
      const modelName = this.model.modelName;
      if (!memoryDb[modelName]) memoryDb[modelName] = [];
      const collection = memoryDb[modelName];
      const filter = this._conditions || {};
      const update = this._update || {};
      
      const op = this.op;
      
      if (op === 'find') {
        let results = collection.filter(d => matchesFilter(d, filter));
        // Simple sort
        const sortOptions = this.options.sort;
        if (sortOptions) {
          const sortKey = Object.keys(sortOptions)[0];
          const sortOrder = sortOptions[sortKey];
          results.sort((a, b) => {
            if (a[sortKey] > b[sortKey]) return sortOrder === -1 ? -1 : 1;
            if (a[sortKey] < b[sortKey]) return sortOrder === -1 ? 1 : -1;
            return 0;
          });
        }
        // Limit/Skip
        if (this.options.skip) results = results.slice(this.options.skip);
        if (this.options.limit) results = results.slice(0, this.options.limit);
        
        return results.map(d => this.model.hydrate(d));
      }
      
      if (op === 'findOne') {
        const doc = collection.find(d => matchesFilter(d, filter));
        return doc ? this.model.hydrate(doc) : null;
      }
      
      if (op === 'findOneAndUpdate') {
        let docIndex = collection.findIndex(d => matchesFilter(d, filter));
        let doc;
        if (docIndex > -1) {
          doc = collection[docIndex];
        } else if (this.options.upsert || this.options.new) {
          doc = { _id: new mongoose.Types.ObjectId() };
          if (update.$setOnInsert) {
            Object.assign(doc, update.$setOnInsert);
          }
          collection.push(doc);
          docIndex = collection.length - 1;
        } else {
          return null;
        }
        
        // Apply updates
        if (update.$set) {
          Object.assign(doc, update.$set);
        }
        if (update.$push) {
          for (let key in update.$push) {
            if (!doc[key]) doc[key] = [];
            doc[key].push(update.$push[key]);
          }
        }
        if (update.$pull) {
          for (let key in update.$pull) {
            if (doc[key]) {
              const pullFilter = update.$pull[key];
              doc[key] = doc[key].filter(item => {
                if (pullFilter._id) {
                  return item._id.toString() !== pullFilter._id.toString();
                }
                return item !== pullFilter;
              });
            }
          }
        }
        
        saveDb();
        return this.model.hydrate(doc);
      }
      
      if (op === 'findOneAndDelete') {
        const docIndex = collection.findIndex(d => matchesFilter(d, filter));
        if (docIndex > -1) {
          const [doc] = collection.splice(docIndex, 1);
          saveDb();
          return this.model.hydrate(doc);
        }
        return null;
      }
      
      if (op === 'countDocuments') {
        return collection.filter(d => matchesFilter(d, filter)).length;
      }
      
      return null;
    }
    return originalExec.apply(this, arguments);
  };
};

const connectDB = async () => {
  try {
    // Attempt MONGODB_URI first (often Atlas)
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[DB] MongoDB connected (Primary): ${conn.connection.host}`);
  } catch (err) {
    console.warn(`[DB] Primary connection failed: ${err.message}`);
    console.log('[DB] Attempting local MongoDB fallback (mongodb://localhost:27017/nexusai)...');
    try {
      const localConn = await mongoose.connect('mongodb://localhost:27017/nexusai', {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`[DB] Local MongoDB connected: ${localConn.connection.host}`);
    } catch (localErr) {
      console.error(`[DB] Local connection failed: ${localErr.message}`);
      console.warn('[DB] Offline Demo Mode Activated. Standard data will persist to local JSON.');
      enableMemoryFallback();
    }
  }
};

mongoose.connection.on('disconnected', () => {
  if (!useMemoryDb) {
    console.warn('[DB] MongoDB disconnected. Retrying...');
  }
});

module.exports = connectDB;

