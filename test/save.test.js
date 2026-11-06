const test = require("node:test");
const assert = require("node:assert/strict");
const { CASH_OFFSET, MAX_CASH, crc32, readBackup, writeBackup } = require("../save.js");

function fakeProfile(cash) {
  const bytes = new Uint8Array(54966);
  bytes.set([0x32, 0x30, 0x43, 0x4d], 0);
  new DataView(bytes.buffer).setUint32(CASH_OFFSET, cash, true);
  return bytes;
}

function fakeBackup(files, { descriptor = false } = {}) {
  const encoder = new TextEncoder();
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const [path, data] of Object.entries(files)) {
    const name = encoder.encode(path);
    const crc = crc32(data);
    const flags = 0x800 | (descriptor ? 8 : 0);

    const local = new Uint8Array(30 + name.length + data.length + (descriptor ? 16 : 0));
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, flags, true);
    lv.setUint32(14, descriptor ? 0 : crc, true);
    lv.setUint32(18, descriptor ? 0 : data.length, true);
    lv.setUint32(22, descriptor ? 0 : data.length, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(data, 30 + name.length);
    if (descriptor) {
      const at = 30 + name.length + data.length;
      lv.setUint32(at, 0x08074b50, true);
      lv.setUint32(at + 4, crc, true);
      lv.setUint32(at + 8, data.length, true);
      lv.setUint32(at + 12, data.length, true);
    }

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, flags, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    central.set(name, 46);

    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }

  const centralSize = centrals.reduce((sum, c) => sum + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, centrals.length, true);
  ev.setUint16(10, centrals.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  const out = new Uint8Array(offset + centralSize + 22);
  let at = 0;
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

const PATH = "NFS Underground 2/Rack/Rack";

function backupWith(cash, options) {
  return fakeBackup(
    {
      "NFS Underground 2/Rack/GARAGE.DAT": new Uint8Array(10202),
      [PATH]: fakeProfile(cash),
      "settings.ini": new TextEncoder().encode("[settings]\n"),
    },
    options,
  );
}

function storedCrcs(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const profile = readBackup(bytes)[0];
  return {
    data: crc32(bytes.subarray(profile.dataStart, profile.dataStart + profile.size)),
    local: dv.getUint32(profile.localOffset + 14, true),
    central: dv.getUint32(profile.centralOffset + 16, true),
  };
}

test("crc32 matches the known value", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
});

test("finds the profile and its money in a backup", () => {
  const profiles = readBackup(backupWith(50));
  assert.equal(profiles.length, 1);
  assert.equal(profiles[0].name, "Rack");
  assert.equal(profiles[0].path, PATH);
  assert.equal(profiles[0].cash, 50);
});

test("writes new money and fixes the zip checksums", () => {
  const before = backupWith(50);
  const after = writeBackup(before, { [PATH]: 9000050 });

  assert.equal(readBackup(after)[0].cash, 9000050);
  assert.equal(readBackup(before)[0].cash, 50);

  const crcs = storedCrcs(after);
  assert.equal(crcs.local, crcs.data);
  assert.equal(crcs.central, crcs.data);
  assert.equal(after.length, before.length);
});

test("fixes the checksum in a data descriptor too", () => {
  const after = writeBackup(backupWith(50, { descriptor: true }), { [PATH]: 777 });
  const profile = readBackup(after)[0];
  const dv = new DataView(after.buffer);
  const descriptorCrc = dv.getUint32(profile.dataStart + profile.size + 4, true);
  assert.equal(profile.cash, 777);
  assert.equal(descriptorCrc, storedCrcs(after).data);
});

test("leaves profiles that are not in the changes alone", () => {
  const before = backupWith(50);
  assert.deepEqual(writeBackup(before, {}), before);
});

test("rejects a file that is not a zip", () => {
  assert.throws(() => readBackup(fakeProfile(50)), /not an nfsu2.xyz backup/);
});

test("rejects a backup without a profile", () => {
  const empty = fakeBackup({ "settings.ini": new TextEncoder().encode("x") });
  assert.throws(() => readBackup(empty), /No profile found/);
});

test("rejects money that is not allowed", () => {
  const backup = backupWith(50);
  for (const bad of [-1, 1.5, MAX_CASH + 1, Number.NaN]) {
    assert.throws(() => writeBackup(backup, { [PATH]: bad }), RangeError);
  }
  assert.equal(readBackup(writeBackup(backup, { [PATH]: MAX_CASH }))[0].cash, MAX_CASH);
});
