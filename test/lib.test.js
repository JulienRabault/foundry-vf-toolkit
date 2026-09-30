import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeTransform, moveToken, moveNote } from '../lib/transform.js';
import { compileGlossary, replaceHtml, replaceText, parseGlossary } from '../lib/glossary.js';
import { englishScore, looksEnglish } from '../lib/english-detector.js';

const official = { sceneX: 100, sceneY: 100, sceneWidth: 1000, sceneHeight: 800 };
const mad = { sceneX: 50, sceneY: 50, sceneWidth: 2000, sceneHeight: 1600 };

test('frame corners map to the target scene corners', () => {
  const t = makeTransform(official, mad, [0.1, 0.1, 0.9, 0.9]);
  assert.deepEqual(t(200, 180), [50, 50]);
  assert.deepEqual(t(1000, 820), [2050, 1650]);
});

test('no frame is a plain rescale', () => {
  const t = makeTransform(official, mad, [0, 0, 1, 1]);
  assert.deepEqual(t(600, 500), [1050, 850]);
});

test('invalid frame is rejected', () => {
  assert.throws(() => makeTransform(official, mad, [0.9, 0, 0.1, 1]));
});

test('tokens keep their centre when the grid size changes', () => {
  const t = makeTransform(official, mad, [0, 0, 1, 1]);
  const tok = moveToken({ x: 100, y: 100, width: 2, height: 2, name: 'Ogre' }, t, 50, 140);
  // centre (150,150) -> (150, 150) mapped -> (50+0.05*2000, 50+0.0625*1600) = (150, 150)
  assert.equal(tok.x + 140, 150 + 0 * 1); // centre x = x + width*grid/2 = x + 140
  assert.equal(tok.y + 140, 150);
  assert.equal(tok.name, 'Ogre');
});

test('notes are moved and rescaled', () => {
  const t = makeTransform(official, mad, [0, 0, 1, 1]);
  const n = moveNote({ x: 600, y: 500, iconSize: 40, fontSize: 32 }, t, 50, 100);
  assert.deepEqual(n, { x: 1050, y: 850, iconSize: 80, fontSize: 64 });
});

const g = compileGlossary([
  ['Wave Echo Cave', 'Caverne du Ressac'],
  ['Phandalin', 'Phandaline'],
  [/\bRedbrands?\b/, 'Fers Rouges'],
]);

test('whole words only, longest first', () => {
  assert.equal(replaceText('Phandalin and Phandaline', g), 'Phandaline and Phandaline');
  assert.equal(replaceText('the Wave Echo Cave map', g), 'the Caverne du Ressac map');
  assert.equal(replaceText('a Redbrand ruffian', g), 'a Fers Rouges ruffian');
});

test('html: tags, attributes and @UUID targets are untouched, labels are translated', () => {
  const html =
    '<p class="Phandalin">Go to @UUID[JournalEntry.Phandalin.JournalEntryPage.x]{Phandalin} <img src="phandalin/Phandalin.webp"></p>';
  assert.equal(
    replaceHtml(html, g),
    '<p class="Phandalin">Go to @UUID[JournalEntry.Phandalin.JournalEntryPage.x]{Phandaline} <img src="phandalin/Phandalin.webp"></p>'
  );
});

test('glossary files accept /regex/flags strings', () => {
  const rules = parseGlossary('[["/\\\\bThundertree\\\\b/","Arbrefoudre"],["Triboar","Troisangliers"]]');
  assert.equal(replaceText('Thundertree, Triboar', compileGlossary(rules)), 'Arbrefoudre, Troisangliers');
});

test('english detector', () => {
  assert.ok(looksEnglish('<p>Each creature in the area must make a Dexterity saving throw.</p>'));
  assert.ok(!looksEnglish('<p>Chaque créature dans la zone doit réussir un jet de sauvegarde de Dextérité.</p>'));
  assert.equal(englishScore('Arc'), 0);
  assert.ok(!looksEnglish('<p>@UUID[Item.the.and.of]{Épée} [[/damage 1d8 the]] Une lame fine.</p>'));
});
