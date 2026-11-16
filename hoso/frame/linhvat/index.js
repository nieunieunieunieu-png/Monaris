// hoso/frame/linhvat/index.js — chỉ gom export của phong cách Linh vật
module.exports = {
  id: 'linhvat',
  name: 'Linh vật',
  ...require('./colors'),
  ...require('./crest'),
  ...require('./border'),
  ...require('./side'),
  ...require('./bottom'),
  ...require('./accents'),
  ...require('./avatar'),
};
