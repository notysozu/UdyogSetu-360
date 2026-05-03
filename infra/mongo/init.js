db = db.getSiblingDB('udyogsetu360');
db.createCollection('bootstrap_notes');
db.bootstrap_notes.insertOne({
  createdAt: new Date(),
  note: 'Starter collection created by infra/mongo/init.js'
});
