'use strict';
const DEFAULT_SHEET = '1q3nYHGLhwIVFWN0bnlN9LjcxYi4iccKyngnJGbWUhm4';
const TTL = 5 * 60 * 1000;
const text = v => String(v ?? '').trim();
const published = v => text(v).toUpperCase() === 'PUBLISHED';
function validId(v, label) {
  const id = text(v);
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(id)) throw new Error(`${label}: ID phải gồm 1-40 chữ/số/_/-.`);
  return id;
}
function parseData(ranges) {
  const [ds, bs, ms] = ranges.map(r => r.values || r);
  for (const [rows, label, count] of [[ds,'Dungeons',4],[bs,'Bosses',6],[ms,'Mechanics',5]]) {
    if (!Array.isArray(rows) || !rows[0] || rows[0].length < count) throw new Error(`Tab ${label} thiếu dòng tiêu đề/cột.`);
  }
  const dungeons = [], bosses = [], mechanics = [];
  const ids = new Set(), bossIds = new Set();
  for (const r of ds.slice(1)) {
    if (!published(r[3])) continue;
    const id=validId(r[0],'DungeonID');
    if (ids.has(id)) throw new Error(`DungeonID trùng: ${id}`);
    if (!text(r[1])) throw new Error(`Phó bản ${id} thiếu tên.`);
    ids.add(id); dungeons.push({id,name:text(r[1]),description:text(r[2])});
  }
  for (const r of bs.slice(1)) {
    if (!published(r[5])) continue;
    const id=validId(r[0],'BossID'), dungeonId=text(r[1]);
    if (bossIds.has(id)) throw new Error(`BossID trùng: ${id}`);
    if (!ids.has(dungeonId)) continue;
    if (!text(r[3])) throw new Error(`Boss ${id} thiếu tên.`);
    bossIds.add(id); bosses.push({id,dungeonId,order:Number(r[2])||0,name:text(r[3]),emoji:text(r[4])});
  }
  for (const [index,r] of ms.slice(1).entries()) {
    if (!published(r[4]) || !bossIds.has(text(r[0])) || !text(r[3])) continue;
    mechanics.push({bossId:text(r[0]),order:Number(r[1])||0,title:text(r[2]),content:text(r[3]),index});
  }
  bosses.sort((a,b)=>a.order-b.order || a.id.localeCompare(b.id));
  mechanics.sort((a,b)=>a.order-b.order || a.index-b.index);
  return { dungeons, bosses, mechanics };
}
function createLoader(fetchRanges, now = Date.now) {
  let cached, last=0, pending;
  return async function load({force=false}={}) {
    if (!force && cached && now()-last<TTL) return cached;
    if (!pending) pending=(async()=>{
      const data=parseData(await fetchRanges()); cached=data;last=now(); return data;
    })().finally(()=>{pending=null;});
    return pending;
  };
}
const getMechBossData = createLoader(async()=>{
  const {google}=require('./googleClient');
  const {getGoogleAuthClient}=require('./auth');
  const auth=await getGoogleAuthClient();
  if (!auth) throw new Error('Chưa có Google credentials.');
  const sheets=google.sheets({version:'v4',auth});
  const spreadsheetId=process.env.MECH_BOSS_SPREADSHEET_ID||DEFAULT_SHEET;
  const meta=await sheets.spreadsheets.get({spreadsheetId,fields:'sheets.properties'}, {timeout:30000});
  const ranges=['Dungeons','Bosses','Mechanics'].map((name,i)=>{
    const props=meta.data.sheets?.find(s=>s.properties.title===name)?.properties;
    if (!props) throw new Error(`Không tìm thấy tab ${name}.`);
    const rows=props.gridProperties?.rowCount||1000;
    if(rows>20000) throw new Error(`Tab ${name} vượt 20000 dòng; cần chia dữ liệu trước khi đọc.`);
    return `'${name}'!A1:${['D','F','F'][i]}${rows}`;
  });
  const result=await sheets.spreadsheets.values.batchGet({spreadsheetId,ranges}, {timeout:30000});
  return result.data.valueRanges||[];
});
module.exports={getMechBossData,parseData,createLoader,DEFAULT_SHEET,TTL};
