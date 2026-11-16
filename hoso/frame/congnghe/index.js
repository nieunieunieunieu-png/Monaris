// hoso/frame/congnghe/index.js — chỉ gom export của phong cách Công nghệ hiện đại
module.exports = {
  id: 'congnghe',
  name: 'Công nghệ hiện đại',
  ...require('./colors'),
  ...require('./crest'),
  ...require('./border'),
  ...require('./side'),
  ...require('./bottom'),
  ...require('./accents'),
  ...require('./avatar'),
};
