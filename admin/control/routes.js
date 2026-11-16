"use strict";
const {sendJson}=require('../httpUtils');
const settings=require('./settings');
const {getEntries}=require('../../AutoReply/monarisSheetKnowledge');
const {bossRoutes}=require('./bossMechanics');
const routes={
 ...bossRoutes,
 'GET /admin/control/settings':(req,res)=>sendJson(res,200,{settings:settings.read()}),
 'POST /admin/control/settings':(req,res,body)=>{try {sendJson(res,200,{ok:true,settings:settings.save(body||{})});}catch(e){sendJson(res,400,{error:e.message});}},
 'GET /admin/control/knowledge':async(req,res)=>{const rows=await getEntries();sendJson(res,200,{count:rows.length,entries:rows.map(({id,topic,keywords,updated})=>({id,topic,keywords,updated}))});}
};
module.exports={controlRoutes:routes};
