

window.onload = function() {
  var mmiterations = document.getElementById('mm-iterations');
  var mmtype = document.getElementById('mm-type');
  var mmclass = document.getElementById('mm-class');
  var mmintellect = document.getElementById('mm-intellect');
  var mmdiscipline = document.getElementById('mm-discipline');
  var mmstrength = document.getElementById('mm-strength');
  var mmtotal = document.getElementById('mm-total');
  var mmdetail = document.getElementById('mm-detail');
  var mmadd = document.getElementById('minmax-add');
  var mmaddbtn = document.getElementById('minmax-add-btn');
  var mmaddbtncancel = document.getElementById('minmax-add-btn-cancel');
  var mmaddbtndone = document.getElementById('minmax-add-btn-done');

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
        // var d = node.cloneNode(true);
        var row = document.createElement('tr');

        var inner = '';
        for(var i in sets[s].stats) {
          inner += '<td class="num">' + sets[s].stats[i] + '</td>';
        }
        inner += '<td class="num">' + (sets[s].stats.int + sets[s].stats.dis + sets[s].stats.str) + '</td>';
        for(var i in sets[s].armor) {
          inner += '<td>' + sets[s].armor[i].name + '</td>';
        }
        // var input = document.createElement('input');
        // input.type = "button";
        // input.id = 'mm-loadout';
        // input.value = '+ Loadout';
        // input.addEventListener('click', function() {
        //   console.log('create new loadout ' + set[s])
        // })
        // inner += input.outerHTML;
        // d.querySelector('.minmax-set').innerHTML = inner;


        row.className = 'minmax-set';
        row.innerHTML = inner;
        row.dataset.index = s;
        iterations.appendChild(row);
      }
      iterations.addEventListener("click", function(element) {
        element = element.target;
        var index = null;
        if(element.parentNode.dataset.index !== undefined) index = element.parentNode.dataset.index;
        else if(element.dataset.index !== undefined) index = element.dataset.index;
        if(index == null) return;
        var gear = sets[index].armor;
        for(var e = 0; e < gear.length; e++) {
          loadout.add(gear[e]);
        }
        loadout.toggle(true);
        minmax.style.display = 'none';
      });
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

  mmaddbtn.addEventListener('click', function() {
    mmadd.style.display = 'block';
  });
  mmaddbtncancel.addEventListener('click', function() {
    mmadd.style.display = 'none';
  });
  mmaddbtndone.addEventListener('click', function() {
    mmadd.style.display = 'none';

    var name = document.getElementById('minmax-add-name');
    var bucket = document.getElementById('minmax-add-bucket');
    var tier = document.getElementById('minmax-add-exotic');
    var classId = document.getElementById('minmax-add-class');

    var item = {
      name: name.value,
      bucket: bucket.options[bucket.selectedIndex].value,
      tier: tier.checked ? 'Exotic' : '',
      class: parseInt(classId.options[classId.selectedIndex].value, 10)
    };

    var stats = [
      {"statHash":2391494160,"value":parseInt(document.getElementById('minmax-add-light').value, 10)},
      {"statHash":144602215,"value":parseInt(document.getElementById('minmax-add-intellect').value, 10)},
      {"statHash":1735777505,"value":parseInt(document.getElementById('minmax-add-discipline').value, 10)},
      {"statHash":4244567218,"value":parseInt(document.getElementById('minmax-add-strength').value, 10)}
    ];

    a.addItem(item, stats, doFilter);
  });
}
