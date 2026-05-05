/** @file IJsonSerializer.js */
export class IJsonSerializer {
  /** @param {string} json @returns {*} */
  deserialize(json)    { throw new Error('IJsonSerializer.deserialize() not implemented'); }
  /** @param {*} value @returns {string} */
  serialize(value)     { throw new Error('IJsonSerializer.serialize() not implemented'); }
}
