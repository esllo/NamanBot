
const customTitlebar = require('custom-electron-titlebar');
new customTitlebar.Titlebar({
  backgroundColor: customTitlebar.Color.fromHex('#444'),
  menu: null,
  titleHorizontalAlignment: 'left',
});