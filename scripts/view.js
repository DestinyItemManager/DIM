
window.onload = function() {
  var mmiterations = document.getElementById('mm-iterations');
  var mmtype = document.getElementById('mm-type');
  var mmclass = document.getElementById('mm-class');
  var mmintellect = document.getElementById('mm-intellect');
  var mmdiscipline = document.getElementById('mm-discipline');
  var mmstrength = document.getElementById('mm-strength');
  var mmtotal = document.getElementById('mm-total');
  var mmdetail = document.getElementById('mm-detail');

  var to = null;

  function doFilter() {
    clearTimeout(to);
    to = setTimeout(function() {
      var params = {};
      if(mmtype.checked) {
        params = {total: mmtotal.value};
      } else {
        params = {int: mmintellect.value, str: mmstrength.value, dis: mmdiscipline.value};
      }
      var sets = a.filter(mmclass.options[mmclass.selectedIndex].value, params);

      iterations.innerHTML = '';

      if(sets.length === 0) {
        iterations.innerHTML = 'no matching sets found. try smaller values.';
        return;
      }

      var node = document.getElementById('minmax-template').content;

      for(var s = 0; s < sets.length; s++) {
        var d = node.cloneNode(true);
        var inner = '';
        for(var i in sets[s].stats) {
          inner += '<td class="num">' + sets[s].stats[i] + '</td>';
        }
        inner += '<td class="num">' + (sets[s].stats.int + sets[s].stats.dis + sets[s].stats.str) + '</td>';
        for(var i in sets[s].armor) {
          inner += '<td>' + sets[s].armor[i].name + '</td>';
        }
        d.querySelector('.minmax-set').innerHTML = inner;
        iterations.appendChild(d);
      }
    }, 200);
  }

  mmtype.addEventListener('change', function() {
    mmdetail.style.display = this.checked ? 'none' : 'inline-block';
    mmtotal.style.display = !this.checked ? 'none' : 'inline-block';

    doFilter();
  });
  mmclass.addEventListener('change', doFilter);
  mmintellect.addEventListener('keyup', doFilter);
  mmdiscipline.addEventListener('keyup', doFilter);
  mmstrength.addEventListener('keyup', doFilter);
  mmtotal.addEventListener('keyup', doFilter);
}
