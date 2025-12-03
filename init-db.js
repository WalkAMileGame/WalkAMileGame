 /*
 init-db.js
  Runs once on first container init. Creates admin and test user and seeds a user.
  Do NOT put production secrets here.
*/
db = db.getSiblingDB("admin");

// create root/admin user (optional)
try {
  db.createUser({
    user: "admin",
    pwd: "adminpass",
    roles: [{ role: "root", db: "admin" }]
  });
} catch (e) {
  // user may already exist; ignore
  print("admin user creation:", e);
}

// create test DB & user
const testDb = db.getSiblingDB("testdb");
try {
  testDb.createUser({
    user: "testuser",
    pwd: "testpass",
    roles: [{ role: "readWrite", db: "testdb" }]
  });
} catch (e) {
  print("test user creation:", e);
}

// seed one document as example
try {
  testDb.users.updateOne(
    { email: "seed@test.local" },
    { $set: { email: "seed@test.local", name: "Seed User", role: "tester" } },
    { upsert: true }
  );
} catch (e) {
  print("seed error:", e);
}