import { ItemInfos } from './dim-item-info';
import {
  appendedToNote,
  collectHashtagsFromInfos,
  getHashtagsFromString,
  removedFromNote,
} from './note-hashtags';

test.each([
  ['#foo #bar', ['#foo', '#bar']],
  ['#foo, #bar', ['#foo', '#bar']],
  ['This note has #foo tag and also#bar', ['#foo']],
  ['#foo#bar', ['#foo']],
  ['#foo,#bar', ['#foo', '#bar']],
  ['#foo-#bar', ['#foo-']], // Not great, could be better
  ['Emoji #🤯 tags', ['#🤯']],
])('getHashtagsFromString: %s', (notes, expectedTags) => {
  const tags = new Set(getHashtagsFromString(notes));
  expect(tags).toEqual(new Set(expectedTags));
});

test('collectHashtagsFromInfos should get a unique set of hashtags from multiple notes', () => {
  const itemInfos: ItemInfos = {
    1: { id: '1', notes: 'This has #three #Hash #tags' }, // A lowercase #three occurs first,
    2: { id: '1', notes: '#Three #🤯' }, // but #Three should be preferred (two occurences)
    3: { id: '1', notes: '#Three' },
    4: { id: '1', notes: '#Hash' },
    5: { id: '1', notes: '#hash' }, // A lowercase #hash occured most recently, but #Hash should be preferred (two occurences)
  };

  expect(new Set(collectHashtagsFromInfos(itemInfos))).toEqual(
    new Set(['#Three', '#Hash', '#tags', '#🤯']),
  );
});

test.each([
  [undefined, 'A note', 'A note'],
  ['A note', '#fancy', 'A note #fancy'],
  ['A #fancy note', '#fancy', 'A #fancy note'],
  ['#pve #s20', '#pve #stasis', '#pve #s20 #stasis'],
  ['#pve #s20', '#void #pve #stasis', '#pve #s20 #void #stasis'],
  ['My favorite! #pve #s20', '#pve #stasis', 'My favorite! #pve #s20 #stasis'],
  ['My favorite!\n#pve #s20', '#pve #stasis', 'My favorite!\n#pve #s20 #stasis'],
  ['My favorite!\n#pve #s20', '#pve\n#stasis', 'My favorite!\n#pve #s20\n#stasis'],
  ['#pve, #s20', '#pve #stasis', '#pve, #s20 #stasis'],
  ['#void', '#void #voidwalker #other', '#void #voidwalker #other'],
])('appendedToNote: %s + %s => %s', (original, appended, expected) => {
  expect(appendedToNote(original, appended)).toBe(expected);
});

test.each([
  ['A note', 'A note', ''],
  ['A note #fancy', '#fancy', 'A note'],
  ['A #fancy note', '#fancy', 'A note'],
  ['#voidwalker #void', '#void', '#voidwalker'],
  ['#voidwalker #void', 'void', '#voidwalker #void'],
  ['#voidwalker My #void gun', 'My #void gun', '#voidwalker'],
  ['#pve, #s20, #stasis', '#s20', '#pve, , #stasis'],
  ['Void void void arc', 'void', 'Void arc'],
])('removedFromNote: %s - %s => %s', (original, removed, expected) => {
  expect(removedFromNote(original, removed)).toBe(expected);
});
