/* 超菜鸡 - 树状列表（只有菜名）+ 点进详情 */
(function () {
  var listView = document.getElementById('list-view');
  var detailView = document.getElementById('detail-view');
  var detailCard = document.getElementById('detail-card');
  var triedListEl = document.getElementById('tried-list');
  var dishListEl = document.getElementById('dish-list');
  var triedCountEl = document.getElementById('tried-count');
  var todoCountEl = document.getElementById('todo-count');
  var noResultEl = document.getElementById('no-result');
  var searchEl = document.getElementById('search');
  var allDishes = [];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* DIY 改版菜（不在机器菜谱里，内容为用户亲口定的改版） */
  var COLA = {
    name: '可乐鸡翅',
    diy: true,
    triedDate: '2026-10-16',
    triedNote: '2026-10-16 首做成功：鸡腿400g不够用香肠补量、没米饭用土豆当主食、零度可乐、葱花点睛。',
    photo: 'images/cola-chicken-done.jpg',
    ings: [
      '<span class="w">鸡翅</span><span class="handnote">✎ 芬兰超市有时买不到鸡翅→用带皮鸡胸肉代替（带皮比纯鸡胸好吃）；不用鸡腿肉：难炖透、难去骨</span> 500克',
      '<span class="w">可乐</span><span class="handnote">✎ 零度可乐代替，味道没差别</span> 1罐（330ml）',
      '生抽 2大勺、料酒 1大勺、姜片 5片',
      '<span class="w">土豆</span><span class="handnote">✎ 没米饭时加土豆等配菜一锅煮，没问题</span> 2个（可选配菜）',
      '<span class="w">葱花</span><span class="handnote">✎ 画龙点睛之笔，一定不能省！</span> 1根'
    ],
    steps: [
      '鸡翅对半切开（或带皮鸡胸肉切大块），冷水下锅焯水去沫，捞出。',
      '热锅少油，下姜片爆香，下鸡肉煎至表面微黄。',
      '加生抽、料酒翻炒上色。',
      '倒入可乐没过食材，大火烧开转小火，盖盖15分钟。',
      '土豆切滚刀块，中途加入同煮至软烂入味。',
      '大火收汁至浓稠，撒葱花出锅。'
    ]
  };

  // 灵活替换提示：只给用户亲口定过的方向，不编造
  function subHint(zhuliao) {
    var z = zhuliao || '';
    var hints = [];
    if (/排骨|肋排/.test(z)) hints.push('排骨可用鸡腿或带皮鸡胸肉代替');
    if (/鸡翅/.test(z)) hints.push('鸡翅可用带皮鸡胸肉代替（芬兰超市鸡翅常缺货）');
    if (/鸡(肉|腿|胸)|土鸡|清远鸡/.test(z)) hints.push('鸡肉部位可互换，带皮鸡胸肉最省事');
    if (/牛(肉|腩|仔骨|板筋)/.test(z)) hints.push('牛肉类部位可互换');
    if (/猪(肉|里脊)|五花肉|肉糜/.test(z)) hints.push('猪肉部位可互换');
    if (!hints.length) hints.push('按冰箱现有食材灵活替换');
    return hints.join('；');
  }

  function hasMissing(note) {
    return /未显示|截断|只有/.test(note || '');
  }

  function isTried(d) { return !!d['做过']; }

  /* 树状竖列：一行一个菜名，点进详情 */
  function treeHTML(dishes) {
    var html = '';
    dishes.forEach(function (d, i) {
      var branch = i === dishes.length - 1 ? '└─ ' : '├─ ';
      html += '<div class="t-row"><span class="branch">' + branch + '</span>' +
        '<a href="#dish=' + encodeURIComponent(d.name) + '">' + esc(d.name) + '</a>';
      if (d.diy) html += ' <span class="tag-diy">DIY改版</span>';
      html += '</div>';
    });
    return html;
  }

  function render(filter) {
    var q = (filter || '').trim();
    var tried = [COLA].concat(allDishes.filter(isTried));
    var todo = allDishes.filter(function (d) { return !isTried(d); });
    var match = function (d) { return !q || d.name.indexOf(q) !== -1; };
    var tShown = tried.filter(match);
    var dShown = todo.filter(match);
    triedListEl.innerHTML = treeHTML(tShown);
    dishListEl.innerHTML = treeHTML(dShown);
    triedCountEl.textContent = '（' + tried.length + ' 道）';
    todoCountEl.textContent = '（' + todo.length + ' 道）';
    noResultEl.hidden = (tShown.length + dShown.length) > 0;
  }

  /* 把批注就地贴到原食材的词旁边（蓝色手写体，一词一注） */
  function withNotes(text, notes) {
    var html = esc(text);
    (notes || []).forEach(function (n) {
      var w = esc(n['词']);
      var idx = html.indexOf(w);
      if (idx !== -1) {
        html = html.slice(0, idx) +
          '<span class="w">' + w + '</span><span class="handnote">✎ ' + esc(n['注']) + '</span>' +
          html.slice(idx + w.length);
      }
    });
    return html;
  }

  function findDish(name) {
    if (name === COLA.name) return COLA;
    for (var i = 0; i < allDishes.length; i++) {
      if (allDishes[i].name === name) return allDishes[i];
    }
    return null;
  }

  function detailHTML(d) {
    var html = '<h3>' + esc(d.name);
    if (d.diy) html += ' <span class="tag-diy">DIY改版</span>';
    if (!d.diy && hasMissing(d['备注'])) html += '<span class="warn">⚠️ 截图信息不全</span>';
    html += '</h3>';

    if (d.diy) {
      html += '<p class="tried-note">' + esc(d.triedNote) + '</p>';
      html += '<img class="done-photo" src="' + esc(d.photo) + '" alt="' + esc(d.name) + '成品">';
      html += '<h4>食材</h4><ul class="ing-list">';
      d.ings.forEach(function (li) { html += '<li>' + li + '</li>'; });
      html += '</ul><h4>做法</h4><ol class="steps">';
      d.steps.forEach(function (s) { html += '<li>' + esc(s) + '</li>'; });
      html += '</ol>';
      return html;
    }

    if (isTried(d)) {
      html += '<p class="tried-note">' + esc(d['经验备注'] || (d['做过'] + ' 首做成功。')) + '</p>';
      if (d['成品图']) {
        html += '<img class="done-photo" src="images/' + esc(d['成品图']) + '" alt="' + esc(d.name) + '成品">';
      }
    }
    html += '<p class="field"><b>原食材：</b>' + withNotes(d['主料'], d['批注']);
    if (d['配料']) html += '；' + esc(d['配料']);
    html += '</p>';
    html += '<p class="field"><b>所需酱料/调料：</b>' + esc(d['调料']) + '</p>';
    html += '<p class="field"><b>灵活替换：</b>' + esc(subHint(d['主料'])) + '</p>';
    if (d['做法步数'] && d['做法步数'] !== '截图未显示') {
      html += '<p class="field"><b>做法：</b>' + esc(d['做法步数']) + '（机器内看步骤）</p>';
    }
    if (d['备注']) {
      html += '<p class="note-missing">📌 ' + esc(d['备注']) + '</p>';
    }
    var imgs = d['图片'] || [];
    if (imgs.length) {
      html += '<div class="shots">';
      imgs.forEach(function (f) {
        html += '<img src="images/' + esc(f) + '" alt="' + esc(d.name) + '菜谱截图" loading="lazy">';
      });
      html += '</div>';
    }
    return html;
  }

  /* 大图查看 */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  function bindLightbox() {
    detailCard.querySelectorAll('.shots img, .done-photo').forEach(function (img) {
      img.onclick = function () {
        lightboxImg.src = img.src;
        lightbox.hidden = false;
      };
    });
  }
  lightbox.onclick = function () { lightbox.hidden = true; };

  function route() {
    var m = /^#dish=(.+)$/.exec(location.hash || '');
    if (m) {
      var d = findDish(decodeURIComponent(m[1]));
      if (d) {
        detailCard.innerHTML = detailHTML(d);
        listView.hidden = true;
        detailView.hidden = false;
        bindLightbox();
        window.scrollTo(0, 0);
        return;
      }
    }
    detailView.hidden = true;
    listView.hidden = false;
  }
  window.addEventListener('hashchange', route);
  document.getElementById('back-link').addEventListener('click', function (e) {
    e.preventDefault();
    history.pushState(null, '', location.pathname + location.search);
    route();
  });

  searchEl.addEventListener('input', function () {
    if (!listView.hidden) render(searchEl.value);
  });

  fetch('dishes.json')
    .then(function (r) { return r.json(); })
    .then(function (data) { allDishes = data; render(''); route(); })
    .catch(function () {
      dishListEl.innerHTML = '<p class="note-missing">菜谱数据加载失败，请检查 dishes.json。</p>';
    });
})();
