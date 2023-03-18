import { decodeShareUrl } from './loadout-import';

describe('dim.gg loadout share links parsing', () => {
  test.each([
    ['4j5nz4q'],
    ['4j5nz4q/Heart-of-Inmost-Light-Arc'],
    ['dim.gg/4j5nz4q'],
    ['https://dim.gg/4j5nz4q'],
    ['https://dim.gg/4j5nz4q/'],
    ['http://dim.gg/4j5nz4q/'],
    ['https://dim.gg/4j5nz4q/Heart-of-Inmost-Light-Arc'],
  ])('valid dim.gg loadout link %s', (arg) => {
    const decoded = decodeShareUrl(arg);
    if (!decoded || decoded.tag !== 'dimGGShare') {
      throw new Error();
    }
    expect(decoded.shareId).toBe('4j5nz4q');
  });

  // Maybe we will have to increase the number of bits in an ID in the future, but we certainly won't decrease them
  expect(decodeShareUrl('dim.gg/4j5nz4qd9asdl')?.tag).toBe('dimGGShare');
  expect(decodeShareUrl('dim.gg/4j5')).toBe(undefined);

  test.each([
    [
      // Generated from DIM
      'https://beta.destinyitemmanager.com/loadouts?loadout=%7B%22id%22%3A%22jf7w53i%22%2C%22name%22%3A%22Simple+Loadout%22%2C%22classType%22%3A3%2C%22clearSpace%22%3Afalse%2C%22equipped%22%3A%5B%5D%2C%22unequipped%22%3A%5B%5D%2C%22createdAt%22%3A1668353218495%2C%22parameters%22%3A%7B%22mods%22%3A%5B2623485440%5D%2C%22lockArmorEnergyType%22%3A1%2C%22assumeArmorMasterwork%22%3A1%7D%7D',
    ],
    [
      // Generated from guardian.report
      'https://app.destinyitemmanager.com/loadouts?loadout={%22name%22:%22robojumper%27s%20loadout%22,%22classType%22:0,%22equipped%22:[{%22id%22:%226917529830717539496%22,%22hash%22:2531963421},{%22id%22:%226917529836701241352%22,%22hash%22:1937552980},{%22id%22:%226917529682880957257%22,%22hash%22:1399243961},{%22id%22:%226917529643654891819%22,%22hash%22:1322544481},{%22id%22:%226917529208297337712%22,%22hash%22:613647804,%22socketOverrides%22:{%220%22:3260056808,%221%22:469281040,%222%22:1399217,%223%22:3866705246,%224%22:2031919264,%225%22:3469412971,%226%22:537774540,%227%22:3469412975,%228%22:2483898429,%229%22:2483898430}}],%22parameters%22:{%22mods%22:[667313240,3521781036,1499759470,2051366208,1740246051,1740246051,1740246051,2187989982,2187989982,1977242754,1977242752,445559589,445559589]}}',
    ],
    [
      // d2armorpicker
      'https://beta.destinyitemmanager.com/4611686018483139177/d2/loadouts?loadout=%7B%22id%22%3A%22d2ap%22%2C%22name%22%3A%22D2ArmorPicker%20Loadout%22%2C%22classType%22%3A1%2C%22parameters%22%3A%7B%22statConstraints%22%3A%5B%7B%22statHash%22%3A2996146975%2C%22minTier%22%3A5%2C%22maxTier%22%3A10%7D%2C%7B%22statHash%22%3A392767087%2C%22minTier%22%3A10%2C%22maxTier%22%3A10%7D%2C%7B%22statHash%22%3A1943323491%2C%22minTier%22%3A0%2C%22maxTier%22%3A10%7D%2C%7B%22statHash%22%3A1735777505%2C%22minTier%22%3A0%2C%22maxTier%22%3A10%7D%2C%7B%22statHash%22%3A144602215%2C%22minTier%22%3A0%2C%22maxTier%22%3A10%7D%2C%7B%22statHash%22%3A4244567218%2C%22minTier%22%3A10%2C%22maxTier%22%3A10%7D%5D%2C%22mods%22%3A%5B1484685887%2C2979815167%2C2850583378%2C2850583378%5D%2C%22assumeArmorMasterwork%22%3A3%2C%22lockArmorEnergyType%22%3A1%2C%22exoticArmorHash%22%3A2773056939%7D%2C%22equipped%22%3A%5B%7B%22id%22%3A%226917529342535580813%22%2C%22hash%22%3A2773056939%7D%2C%7B%22id%22%3A%226917529801497037343%22%2C%22hash%22%3A1148597205%7D%2C%7B%22id%22%3A%226917529793250524983%22%2C%22hash%22%3A145651147%7D%2C%7B%22id%22%3A%226917529807139650343%22%2C%22hash%22%3A2724719415%7D%2C%7B%22id%22%3A%2212345%22%2C%22hash%22%3A2453351420%2C%22socketOverrides%22%3A%7B%227%22%3A2661180602%2C%228%22%3A2272984671%7D%7D%5D%2C%22unequipped%22%3A%5B%5D%2C%22clearSpace%22%3Afalse%7D',
    ],
  ])('valid direct loadout link %s', (arg) => {
    const decoded = decodeShareUrl(arg);
    if (!decoded || decoded.tag !== 'urlLoadout') {
      throw new Error();
    }
    expect(decoded.loadout.parameters!.mods!.length).not.toBe(0);
  });

  test.each([
    [
      // guardianforge
      'https://app.destinyitemmanager.com/optimizer?class=0&p=%7B%22mods%22%3A%5B518224751%2C640058316%2C4283235143%2C555005975%2C3394151347%2C3394151347%2C282898303%2C2645858828%2C403494087%2C864745275%2C2216063963%2C2645858828%2C2588939505%2C2216063960%2C2645858828%2C3320641683%2C1708067044%2C2979815167%2C555005975%2C3974455041%2C3974455041%2C1484685887%5D%7D',
    ],
  ])('valid deprecated LO link %s', (arg) => {
    const decoded = decodeShareUrl(arg);
    if (!decoded || decoded.tag !== 'urlParameters') {
      throw new Error();
    }
    expect(decoded.urlParameters!.parameters!.mods!.length).not.toBe(0);
  });
});
