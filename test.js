const db = require('better-sqlite3')('dev.db'); console.log(db.prepare('SELECT COUNT(*) as c FROM WorkOrder').get());
