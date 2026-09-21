import assert from "node:assert/strict";
import { describeMigration, migrateLocalLibraryPayload, LOCAL_LIBRARY_SCHEMA_VERSION } from "../lib/local-library-schema.ts";

const legacy = { version: 1, favoriteSurahs: [2], playlists: [] };
const migrated = migrateLocalLibraryPayload(legacy);
assert.equal(migrated?.version, LOCAL_LIBRARY_SCHEMA_VERSION);
assert.deepEqual(migrated?.favoriteSurahs, [2]);
assert.equal(describeMigration(legacy).migrated, true);
assert.equal(migrateLocalLibraryPayload({ version: 99 }), null);
assert.equal(migrateLocalLibraryPayload("corrupted"), null);
assert.equal(migrateLocalLibraryPayload({ favoriteAyahs: ["2:1"] })?.version, LOCAL_LIBRARY_SCHEMA_VERSION);
console.log("LocalLibrary migrations: OK");
