import ts from 'typescript';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const loadTS = (file, mocks = {}) => {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
  return module.exports;
};
let count = 0;
function check(name, fn) { fn(); count++; console.log('PASS', name); }
const p = loadTS('lib/playlist-integrity.ts');
const base = p.normalizePlaylist({ id: 'test', title: 'Test collection', ayahKeys: ['1:1', '1:2'], createdAt: 1, updatedAt: 1 });
check('legacy playlists retain every valid member', () => assert.deepEqual(base.itemOrder, ['quran:1:1','quran:1:2']));
check('malformed playlists are rejected', () => { for (const input of [null, [], {}, 'text', {id: 'x', title:''}]) assert.equal(p.normalizePlaylist(input), null); });
check('normalization removes duplicates, dangling order and invalid keys', () => {
  const result = p.normalizePlaylist({ ...base, ayahKeys: ['1:1','1:1','999:0',null], spokenContentIds: ['a',null,'a'], itemOrder: ['spoken:a','quran:1:1','spoken:a','spoken:missing',null] });
  assert.deepEqual(result.itemOrder, ['spoken:a','quran:1:1']);
});
check('normalization is idempotent and nonmutating', () => { const text = JSON.stringify(base); assert.deepEqual(p.normalizePlaylist(base), base); assert.equal(JSON.stringify(base), text); });
check('cross-family insertion requires consent in Quran-first playlists', () => assert.equal(p.addPlaylistItem(base, 'spoken:a'), base));
check('cross-family insertion requires consent in spoken-first playlists', () => {
  const list = p.normalizePlaylist({id:'a',title:'test',spokenContentIds:['a']}); assert.equal(p.addPlaylistItem(list,'quran:1:1'), list);
});
const mixed = p.addPlaylistItem({...base,allowMixedContent:true}, 'spoken:a', 2);
check('consented insert updates all representations', () => { assert.equal(mixed.itemOrder.at(-1),'spoken:a'); assert.deepEqual(mixed.spokenContentIds,['a']); });
check('adding twice is idempotent', () => assert.equal(p.addPlaylistItem(mixed,'spoken:a'), mixed));
check('removing spoken item preserves Quran and consistent order', () => { const result=p.removePlaylistItem(mixed,'spoken:a',3); assert.deepEqual(result.spokenContentIds,[]); assert.deepEqual(result.itemOrder,base.itemOrder); });
check('removing Quran item preserves spoken and consistent order', () => { const result=p.removePlaylistItem(mixed,'quran:1:1',3); assert.deepEqual(result.ayahKeys,['1:2']); assert.deepEqual(result.itemOrder,['quran:1:2','spoken:a']); });
check('reordering moves both families in one sequence', () => assert.deepEqual(p.movePlaylistEntry(mixed,2,0).itemOrder,['spoken:a','quran:1:1','quran:1:2']));
check('invalid reorder cannot corrupt the collection', () => { for(const [from,to] of [[-1,0],[0,999],[NaN,0],[1.2,0],[0,0]]) assert.equal(p.movePlaylistEntry(mixed,from,to),mixed); });
check('duplicate IDs and excessive collections are bounded', () => assert.equal(p.normalizePlaylists([base,base]).length,1));
const run=p.startPlaylistRun(mixed,1);
check('active run snapshots the order', () => { const changed=p.movePlaylistEntry(mixed,2,0); assert.deepEqual(run.items,mixed.itemOrder); assert.notDeepEqual(run.items,changed.itemOrder); });
check('stale ended events cannot skip an entry', () => assert.equal(p.nextPlaylistRun(run,'spoken:a',true).type,'stale'));
check('family boundary requests explicit confirmation', () => assert.equal(p.nextPlaylistRun(run,'quran:1:2',false).type,'consent'));
check('consented boundary advances exactly one entry', () => { const next=p.nextPlaylistRun(run,'quran:1:2',true); assert.equal(next.type,'next'); assert.equal(next.run.index,2); });
check('last item ends instead of restarting', () => assert.equal(p.nextPlaylistRun(p.startPlaylistRun(mixed,2),'spoken:a',true).type,'end'));
check('invalid run start is rejected', () => { for(const n of [-1,999,NaN,0.2]) assert.equal(p.startPlaylistRun(mixed,n),null); });
const owner = loadTS('lib/playback-ownership.ts');
check('a second player pauses the previous owner exactly once', () => { const a={}, b={}; let stops=0; owner.claimPlayback(a,()=>stops++);owner.claimPlayback(b,()=>{});owner.claimPlayback(b,()=>{});assert.equal(stops,1);assert.equal(owner.ownsPlayback(a),false);owner.releasePlayback(a);assert.equal(owner.ownsPlayback(b),true);owner.releasePlayback(b); });
const v=loadTS('lib/media-variants.ts');
check('foreign content variants are never selected', () => { const asset={id:'a',kind:'AUDIO',variantIds:['v','foreign']}; const variants=[{id:'v',mediaAssetId:'a',kind:'AUDIO',quality:'STANDARD'},{id:'foreign',mediaAssetId:'b',kind:'VIDEO'}];assert.deepEqual(v.siblingMediaVariants(asset,variants).map(x=>x.id),['v']);assert.equal(v.findSwitchVariant(asset,variants,'VIDEO'),null); });
check('every application TypeScript/TSX file parses', () => {
  const walk=dir=>{for(const name of readdirSync(dir)){const file=resolve(dir,name);if(statSync(file).isDirectory())walk(file);else if(/\.tsx?$/.test(name)&&!name.endsWith('.d.ts')){const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);assert.deepEqual(source.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')),[],file);}}};
  for(const dir of ['app','components','hooks','lib'])walk(dir);
});
check('only one playlist detail and valid play handler are rendered', () => { const text=readFileSync('components/app-shell.tsx','utf8');assert(!text.includes('playPlaylistItem(playlist.id,0)}}'));assert(!text.includes('className="library-section playlist-detail"')); });
console.log(`\n${count} regression checks passed.`);
