const o = (() => {
  let b = document.body;
  const as = (l) => {
    let e = document.createElement('script');
    e.src = l+'.js';
    b.appendChild(e);
  };
  // window.cp = 0;
  // as('login');
  // as('cmd');
})();