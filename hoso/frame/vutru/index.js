// hoso/frame/vutru/index.js — chỉ gom export của phong cách Vũ trụ
module.exports = {
  id: 'vutru',
  name: 'Vũ trụ',
  ...require('./colors'),
  ...require('./crest'),
  ...require('./border'),
  ...require('./side'),
  ...require('./bottom'),
  ...require('./accents'),
  ...require('./avatar'),
};
