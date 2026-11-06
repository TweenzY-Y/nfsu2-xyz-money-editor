(function (root) {
  const MAGIC = "20CM";
  const CASH_OFFSET = 0xa16a;
  const MAX_CASH = 2147483647;

  const LOCAL_HEADER = 0x04034b50;
  const CENTRAL_HEADER = 0x02014b50;
  const END_OF_CENTRAL = 0x06054b50;
  const DATA_DESCRIPTOR = 0x08074b50;

  const CRC_TABLE = new Uint32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    return c >>> 0;
  });

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function toBytes(data) {
    if (data instanceof Uint8Array) {
      return data;
    }
    if (data instanceof ArrayBuffer) {
      return new Uint8Array(data);
    }
    throw new TypeError("Expected a Uint8Array or an ArrayBuffer.");
  }

  function view(bytes) {
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  function isProfile(bytes, start, length) {
    if (length < CASH_OFFSET + 4) {
      return false;
    }
    const magic = String.fromCharCode(bytes[start], bytes[start + 1], bytes[start + 2], bytes[start + 3]);
    return magic === MAGIC;
  }

  function checkCash(value) {
    if (!Number.isInteger(value) || value < 0 || value > MAX_CASH) {
      throw new RangeError(`Money must be a whole number from 0 to ${MAX_CASH.toLocaleString("en-US")}.`);
    }
  }

  function findEndOfCentral(bytes) {
    const dv = view(bytes);
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
      if (dv.getUint32(i, true) === END_OF_CENTRAL) {
        return i;
      }
    }
    return -1;
  }

  function readBackup(data) {
    const bytes = toBytes(data);
    const end = bytes.length >= 22 ? findEndOfCentral(bytes) : -1;
    if (end < 0) {
      throw new Error("This is not an nfsu2.xyz backup. On nfsu2.xyz, open the Saves tab and click Download backup.");
    }

    const dv = view(bytes);
    const count = dv.getUint16(end + 10, true);
    let pos = dv.getUint32(end + 16, true);
    const decoder = new TextDecoder();
    const profiles = [];

    for (let i = 0; i < count; i++) {
      if (dv.getUint32(pos, true) !== CENTRAL_HEADER) {
        throw new Error("This nfsu2.xyz backup is damaged. Download a new backup from the Saves tab.");
      }
      const flags = dv.getUint16(pos + 8, true);
      const method = dv.getUint16(pos + 10, true);
      const size = dv.getUint32(pos + 20, true);
      const nameLength = dv.getUint16(pos + 28, true);
      const extraLength = dv.getUint16(pos + 30, true);
      const commentLength = dv.getUint16(pos + 32, true);
      const localOffset = dv.getUint32(pos + 42, true);
      const path = decoder.decode(bytes.subarray(pos + 46, pos + 46 + nameLength));

      if (dv.getUint32(localOffset, true) !== LOCAL_HEADER) {
        throw new Error("This nfsu2.xyz backup is damaged. Download a new backup from the Saves tab.");
      }
      const dataStart =
        localOffset + 30 + dv.getUint16(localOffset + 26, true) + dv.getUint16(localOffset + 28, true);

      if (method === 0 && isProfile(bytes, dataStart, size)) {
        const parts = path.split("/");
        profiles.push({
          name: parts[parts.length - 1],
          path,
          cash: dv.getUint32(dataStart + CASH_OFFSET, true),
          flags,
          size,
          centralOffset: pos,
          localOffset,
          dataStart,
        });
      }

      pos += 46 + nameLength + extraLength + commentLength;
    }

    if (profiles.length === 0) {
      throw new Error(
        "No profile found in this backup. Play on nfsu2.xyz, save in the Garage, then download a new backup.",
      );
    }
    return profiles;
  }

  function writeBackup(data, changes) {
    const copy = new Uint8Array(toBytes(data));
    const dv = view(copy);

    for (const profile of readBackup(copy)) {
      if (!Object.prototype.hasOwnProperty.call(changes, profile.path)) {
        continue;
      }
      const value = changes[profile.path];
      checkCash(value);
      dv.setUint32(profile.dataStart + CASH_OFFSET, value, true);

      const crc = crc32(copy.subarray(profile.dataStart, profile.dataStart + profile.size));
      dv.setUint32(profile.localOffset + 14, crc, true);
      dv.setUint32(profile.centralOffset + 16, crc, true);

      if (profile.flags & 8) {
        let descriptor = profile.dataStart + profile.size;
        if (dv.getUint32(descriptor, true) === DATA_DESCRIPTOR) {
          descriptor += 4;
        }
        dv.setUint32(descriptor, crc, true);
      }
    }
    return copy;
  }

  const api = { MAGIC, CASH_OFFSET, MAX_CASH, crc32, readBackup, writeBackup };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.Nfsu2Save = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
