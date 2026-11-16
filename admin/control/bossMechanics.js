'use strict';
const { getGoogleAuthClient } = require('../../googleSheets/auth');
const { SPREADSHEET_ID } = require('../../config');
const { sendJson } = require('../httpUtils');
const ID = process.env.MONARIS_KNOWLEDGE_SPREADSHEET_ID || SPREADSHEET_ID || process.env.GOOGLE_SHEET_ID;
const RANGE = "'Boss_Mechanics'!A2:K500";
const FIELDS = ['mechanicId','dungeonId','boss','order','name','signal','solution','role','keywords','source','status'];
const statusValues = new Set(['Bật','Tắt','Mẫu']);
let lock = Promise.resolve();
const norm = x => String(x ?? '').trim();
function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Dữ liệu không hợp lệ');
  const item = Object.fromEntries(FIELDS.map(k => [k,norm(input[k])]));
  if (!item.mechanicId || !item.boss || !item.name || !item.solution) throw new Error('Cần ID, tên Boss, tên cơ chế và cách xử lý');
  if (!/^[a-zA-Z0-9_-]{3,64}$/.test(item.mechanicId)) throw new Error('ID chỉ gồm chữ, số, _ hoặc - (3–64 ký tự)');
  if (!statusValues.has(item.status)) throw new Error('Trạng thái phải là Bật, Tắt hoặc Mẫu');
  for (const [k,v] of Object.entries(item)) if (v.length > (k==='solution'?4000: k==='signal'?2000:500)) throw new Error(`Trường ${k} quá dài`);
  return item;
}
async function api(method,range,data) {
  if (!ID) throw new Error('Chưa có GOOGLE_SHEET_ID');
  const auth = await getGoogleAuthClient();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(ID)}/values/${encodeURIComponent(range)}`;
  const res = await auth.request({url,method, ...(data?{data}:{}),params:method==='GET'?{}:{valueInputOption:'RAW'}});
  return res.data;
}
async function rows() {const x=await api('GET',RANGE);return (x.values||[]).map((r,i)=>({row:i+2,...Object.fromEntries(FIELDS.map((k,j)=>[k,String(r[j]||'')]))})).filter(x=>x.mechanicId);}
async function mutate(body) {
  const prior=lock; let unlock;lock=new Promise(resolve=>unlock=resolve);await prior;
  try {
    const item=validate(body);
    const all=await rows();
    const current=all.find(x=>x.mechanicId===item.mechanicId);
    const action=norm(body.action);
    if(action==='create' && current) throw new Error('ID cơ chế đã tồn tại');
    if(action==='update' && !current) throw new Error('Không tìm thấy ID cần chỉnh sửa');
    if(action!=='create' && action!=='update') throw new Error('Thao tác không hợp lệ');
    if(action==='update' && norm(body.expectedRow) !== String(current.row)) throw new Error('Dòng đã thay đổi, hãy tải lại danh sách');
    const target=current?.row || (all.length ? Math.max(...all.map(x=>x.row))+1:2);
    if(target>500) throw new Error('Đã đạt giới hạn 500 dòng; cần mở rộng bảng');
    const values=[FIELDS.map(k=>item[k])];
    await api('PUT',`'Boss_Mechanics'!A${target}:K${target}`,{range:`'Boss_Mechanics'!A${target}:K${target}`,majorDimension:'ROWS',values});
    return {ok:true,row:target};
  } finally {unlock();}
}
module.exports={bossRoutes:{
 'GET /admin/control/boss':async(req,res)=>sendJson(res,200,{entries:await rows()}),
 'POST /admin/control/boss':async(req,res,body)=>{try{sendJson(res,200,await mutate(body));}catch(e){sendJson(res,400,{error:e.message});}}
}};
