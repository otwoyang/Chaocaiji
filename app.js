/* 超菜鸡 - 渲染 29 道机器菜谱 */
(function () {
  var listEl = document.getElementById('dish-list');
  var countEl = document.getElementById('count');
  var noResultEl = document.getElementById('no-result');
  var searchEl = document.getElementById('search');
  var allDishes = [];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

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

  function cardHTML(d) {
    var html = '<article class="dish-card" data-name="' + esc(d.name) + '">';
    html += '<h3>' + esc(d.name);
    if (hasMissing(d['备注'])) html += '<span class="warn">⚠️ 截图信息不全</span>';
    html += '</h3>';
    html += '<p class="field"><b>原食材：</b>' + esc(d['主料']);
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
    html += '</article>';
    return html;
  }

  function render(filter) {
    var q = (filter || '').trim();
    var shown = allDishes.filter(function (d) {
      return !q || d.name.indexOf(q) !== -1;
    });
    listEl.innerHTML = shown.map(cardHTML).join('');
    countEl.textContent = '（' + shown.length + '/' + allDishes.length + '）';
    noResultEl.hidden = shown.length > 0;
    bindLightbox();
  }

  // 大图查看
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  function bindLightbox() {
    listEl.querySelectorAll('.shots img').forEach(function (img) {
      img.onclick = function () {
        lightboxImg.src = img.src;
        lightbox.hidden = false;
      };
    });
  }
  lightbox.onclick = function () { lightbox.hidden = true; };
  document.querySelector('.done-photo').onclick = function () {
    lightboxImg.src = this.src;
    lightbox.hidden = false;
  };

  searchEl.addEventListener('input', function () { render(searchEl.value); });

  fetch('dishes.json')
    .then(function (r) { return r.json(); })
    .then(function (data) { allDishes = data; render(''); })
    .catch(function () {
      listEl.innerHTML = '<p class="note-missing">菜谱数据加载失败，请检查 dishes.json。</p>';
    });
})();
