(function (root) {
  'use strict';

  var STORAGE_KEY = 'nhom8_dieu_hanh_xom_v1';
  var STORAGE_VERSION = 1;
  var INITIAL_SCORE = 50;
  var SWIPE_THRESHOLD_PX = 60;

  var DATA = root.GAME_DATA || (typeof require === 'function' ? require('./cards.js') : null);

  function clampScore(value) {
    return Math.max(0, Math.min(100, value));
  }

  function createInitialScores(metricsList) {
    var metrics = metricsList || (DATA ? DATA.METRICS : []);
    var scores = {};
    for (var i = 0; i < metrics.length; i += 1) {
      scores[metrics[i].key] = typeof metrics[i].initial === 'number' ? metrics[i].initial : INITIAL_SCORE;
    }
    return scores;
  }

  function applyChoiceToState(scores, card, side) {
    var branch = side === 'left' ? card.left : card.right;
    var next = {
      T: scores.T,
      C: scores.C,
      N: scores.N,
      D: scores.D
    };
    var deltas = branch && branch.deltas ? branch.deltas : {};
    var keys = Object.keys(deltas);
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      if (Object.prototype.hasOwnProperty.call(next, key)) {
        next[key] = clampScore(next[key] + deltas[key]);
      }
    }
    return next;
  }

  function computeStateFromChoices(choices, cardsList, metricsList) {
    var cards = cardsList || (DATA ? DATA.CARDS : []);
    var metrics = metricsList || (DATA ? DATA.METRICS : []);
    var scores = createInitialScores(metrics);
    var unlockedCharacteristics = [];
    var seenChar = {};

    for (var i = 0; i < choices.length; i += 1) {
      var side = choices[i];
      var card = cards[i];
      if (!card || (side !== 'left' && side !== 'right')) {
        continue;
      }
      scores = applyChoiceToState(scores, card, side);
      if (card.characteristicId && !seenChar[card.characteristicId]) {
        seenChar[card.characteristicId] = true;
        unlockedCharacteristics.push(card.characteristicId);
      }
    }

    return {
      scores: scores,
      unlockedCharacteristics: unlockedCharacteristics
    };
  }

  function getCollectedCharacteristics(choices, cardsList) {
    return computeStateFromChoices(choices, cardsList).unlockedCharacteristics;
  }

  function sanitizeSavedState(raw, totalCards) {
    if (!raw || typeof raw !== 'object' || raw.version !== STORAGE_VERSION) {
      return null;
    }
    if (!Array.isArray(raw.choices) || raw.choices.length > totalCards) {
      return null;
    }
    var cleanChoices = [];
    for (var i = 0; i < raw.choices.length; i += 1) {
      if (raw.choices[i] !== 'left' && raw.choices[i] !== 'right') {
        return null;
      }
      cleanChoices.push(raw.choices[i]);
    }

    var screen = raw.screen === 'intro' || raw.screen === 'play' || raw.screen === 'summary' ? raw.screen : 'intro';
    var phase = raw.phase === 'card' || raw.phase === 'feedback' ? raw.phase : 'card';

    if (cleanChoices.length === 0) {
      phase = 'card';
      if (screen === 'summary') {
        screen = 'intro';
      }
    } else if (cleanChoices.length === totalCards) {
      if (phase === 'card' && screen !== 'intro') {
        screen = 'summary';
      }
    } else if (screen === 'summary') {
      screen = 'play';
    }

    return {
      version: STORAGE_VERSION,
      screen: screen,
      phase: phase,
      choices: cleanChoices
    };
  }

  function formatDelta(val) {
    if (val > 0) {
      return '+' + val;
    }
    if (val < 0) {
      return '−' + Math.abs(val);
    }
    return '0';
  }

  function formatDeltasInline(deltas, metrics) {
    var parts = [];
    var keys = Object.keys(deltas || {});
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var val = deltas[key];
      if (!val) {
        continue;
      }
      var name = key;
      for (var j = 0; j < metrics.length; j += 1) {
        if (metrics[j].key === key) {
          name = metrics[j].name;
          break;
        }
      }
      parts.push(name + ' ' + formatDelta(val));
    }
    return parts.join(', ');
  }

  // Browser runtime controller
  function initApp() {
    if (!DATA) {
      return;
    }

    var cards = DATA.CARDS;
    var metrics = DATA.METRICS;
    var characters = DATA.CHARACTERS;
    var lesson = DATA.LESSON_CONTENT;

    var state = {
      version: STORAGE_VERSION,
      screen: 'intro',
      phase: 'card',
      choices: []
    };
    var activeCharacteristicId = lesson.characteristics[0].id;
    var isChoiceLocked = false;
    var isEphemeralMode = false;
    var previewCardOffset = null; // 0-based index when ?card=N or presenter Card 07 is used
    var previewChoiceSide = null;
    var backupSummaryChoices = null; // Preserves completed run when presenter jumps to Card 07 from Summary
    var suppressClickUntil = 0;
    var lastModalTrigger = null;

    // DOM refs
    var el = {
      screenIntro: document.getElementById('screen-intro'),
      screenPlay: document.getElementById('screen-play'),
      screenSummary: document.getElementById('screen-summary'),
      introCopy: document.getElementById('intro-copy'),
      btnResume: document.getElementById('btn-resume'),
      btnStart: document.getElementById('btn-start'),

      btnHome: document.getElementById('btn-home'),
      btnRestartTop: document.getElementById('btn-restart-top'),
      progressText: document.getElementById('progress-text'),
      progressDots: document.getElementById('progress-dots'),
      metricsGrid: document.getElementById('metrics-grid'),

      decisionCard: document.getElementById('decision-card'),
      swipeStampLeft: document.getElementById('swipe-stamp-left'),
      swipeStampRight: document.getElementById('swipe-stamp-right'),
      stampLabelLeft: document.getElementById('stamp-label-left'),
      stampLabelRight: document.getElementById('stamp-label-right'),
      cardLessonTag: document.getElementById('card-lesson-tag'),
      cardCodeBadge: document.getElementById('card-code-badge'),
      portraitFrame: document.getElementById('portrait-frame'),
      speakerPortrait: document.getElementById('speaker-portrait'),
      speakerName: document.getElementById('speaker-name'),
      speakerRole: document.getElementById('speaker-role'),

      phaseCard: document.getElementById('phase-card'),
      cardSituation: document.getElementById('card-situation'),
      phaseFeedback: document.getElementById('phase-feedback'),
      feedbackSituationEcho: document.getElementById('feedback-situation-echo'),
      chosenLabel: document.getElementById('chosen-label'),
      deltaBadges: document.getElementById('delta-badges'),
      feedbackText: document.getElementById('feedback-text'),
      feedbackLessonName: document.getElementById('feedback-lesson-name'),
      feedbackCharNote: document.getElementById('feedback-characteristic-note'),

      choiceButtons: document.getElementById('choice-buttons'),
      btnChoiceLeft: document.getElementById('btn-choice-left'),
      btnChoiceRight: document.getElementById('btn-choice-right'),
      btnLeftText: document.getElementById('btn-left-text'),
      btnRightText: document.getElementById('btn-right-text'),
      btnNext: document.getElementById('btn-next'),
      btnPreviewSummary: document.getElementById('btn-preview-summary'),
      swipeHint: document.getElementById('swipe-hint'),

      summaryStatusBadge: document.getElementById('summary-status-badge'),
      btnPresentCard7: document.getElementById('btn-present-card7'),
      summaryMetricsGrid: document.getElementById('summary-metrics-grid'),
      characteristicsGrid: document.getElementById('characteristics-grid'),
      characteristicDetail: document.getElementById('characteristic-detail'),
      btnOpenReview: document.getElementById('btn-open-review'),
      btnReplay: document.getElementById('btn-replay'),

      reviewModal: document.getElementById('review-modal'),
      reviewModalBody: document.getElementById('review-modal-body'),
      btnCloseReview: document.getElementById('btn-close-review'),
      btnCloseReviewBottom: document.getElementById('btn-close-review-bottom'),

      confirmModal: document.getElementById('confirm-modal'),
      confirmModalDesc: document.getElementById('confirm-modal-desc'),
      btnCancelRestart: document.getElementById('btn-cancel-restart'),
      btnConfirmRestart: document.getElementById('btn-confirm-restart')
    };

    function safeLoadState() {
      try {
        var rawText = window.localStorage.getItem(STORAGE_KEY);
        if (!rawText) {
          return null;
        }
        return sanitizeSavedState(JSON.parse(rawText), cards.length);
      } catch (err) {
        return null;
      }
    }

    function safeSaveState() {
      if (isEphemeralMode) {
        return;
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (err) {
        // Storage blocked: game continues seamlessly in-memory for current session.
      }
    }

    function syncBodyModalLock() {
      var anyOpen =
        !el.reviewModal.classList.contains('hidden') ||
        !el.confirmModal.classList.contains('hidden');
      document.body.classList.toggle('modal-open', anyOpen);
    }

    function resetScrollTop(targetScreen) {
      if (typeof window.scrollTo === 'function') {
        window.scrollTo(0, 0);
      }
      if (targetScreen) {
        targetScreen.scrollTop = 0;
      }
    }

    function triggerClassAnimation(node, className) {
      if (!node) {
        return;
      }
      node.classList.remove(className);
      // Force reflow so rapid consecutive card transitions re-run the CSS keyframe cleanly
      void node.offsetWidth;
      node.classList.add(className);
    }

    function attachIconWithFallback(parent, src, fallbackEmoji, className, sizePx) {
      var img = document.createElement('img');
      img.className = className;
      img.src = src;
      img.alt = '';
      img.width = sizePx;
      img.height = sizePx;
      img.setAttribute('aria-hidden', 'true');
      img.addEventListener('error', function () {
        if (!img.parentNode) {
          return;
        }
        var span = document.createElement('span');
        span.className = 'metric-emoji-fallback';
        span.setAttribute('aria-hidden', 'true');
        span.textContent = fallbackEmoji || '🌾';
        img.parentNode.replaceChild(span, img);
      });
      parent.appendChild(img);
    }

    function preloadGameAssets() {
      var urls = [];
      var i;
      for (i = 0; i < metrics.length; i += 1) {
        urls.push(metrics[i].icon);
      }
      for (i = 0; i < lesson.characteristics.length; i += 1) {
        urls.push(lesson.characteristics[i].icon);
      }
      var charKeys = Object.keys(characters);
      for (i = 0; i < charKeys.length; i += 1) {
        var ch = characters[charKeys[i]];
        urls.push(ch.portrait);
        if (window.devicePixelRatio && window.devicePixelRatio > 1.25 && ch.portrait2x) {
          urls.push(ch.portrait2x);
        }
      }

      var runPreload = function () {
        for (var u = 0; u < urls.length; u += 1) {
          var preImg = new Image();
          preImg.src = urls[u];
        }
      };

      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(runPreload, { timeout: 1200 });
      } else {
        setTimeout(runPreload, 250);
      }
    }

    function getCurrentCardIndex() {
      if (previewCardOffset !== null) {
        return previewCardOffset;
      }
      if (state.phase === 'feedback') {
        return Math.max(0, state.choices.length - 1);
      }
      return Math.min(cards.length - 1, state.choices.length);
    }

    function getMetricByKey(key) {
      for (var i = 0; i < metrics.length; i += 1) {
        if (metrics[i].key === key) {
          return metrics[i];
        }
      }
      return null;
    }

    function getCharacteristicById(id) {
      for (var i = 0; i < lesson.characteristics.length; i += 1) {
        if (lesson.characteristics[i].id === id) {
          return lesson.characteristics[i];
        }
      }
      return null;
    }

    function hasInProgressSave(saved) {
      if (!saved) {
        return false;
      }
      if (saved.choices.length === 0) {
        return false;
      }
      if (saved.choices.length < cards.length) {
        return true;
      }
      return saved.phase === 'feedback';
    }

    function getResumeCardNumber(saved) {
      if (!saved) {
        return 1;
      }
      if (saved.phase === 'feedback') {
        return Math.max(1, saved.choices.length);
      }
      return Math.min(cards.length, saved.choices.length + 1);
    }

    function renderMetricsGrid(container, scores, activeDeltas) {
      container.innerHTML = '';
      for (var i = 0; i < metrics.length; i += 1) {
        var m = metrics[i];
        var val = scores[m.key];
        var delta = activeDeltas && typeof activeDeltas[m.key] === 'number' ? activeDeltas[m.key] : 0;

        var card = document.createElement('div');
        card.className = 'metric-card ' + m.colorClass;
        if (delta > 0) {
          card.className += ' is-changed-up';
        } else if (delta < 0) {
          card.className += ' is-changed-down';
        }

        var top = document.createElement('div');
        top.className = 'metric-top';

        attachIconWithFallback(top, m.icon, m.fallbackEmoji, 'metric-icon', 22);

        var label = document.createElement('span');
        label.className = 'metric-label';
        label.textContent = m.name;
        top.appendChild(label);

        var scoreEl = document.createElement('span');
        scoreEl.className = 'metric-score';
        scoreEl.textContent = val + '/100';
        top.appendChild(scoreEl);
        card.appendChild(top);

        var barRow = document.createElement('div');
        barRow.className = 'metric-bar-row';

        var track = document.createElement('div');
        track.className = 'metric-bar-track';
        track.setAttribute('role', 'progressbar');
        track.setAttribute('aria-label', m.name);
        track.setAttribute('aria-valuemin', '0');
        track.setAttribute('aria-valuemax', '100');
        track.setAttribute('aria-valuenow', String(val));

        var fill = document.createElement('div');
        fill.className = 'metric-bar-fill';
        fill.style.width = val + '%';
        track.appendChild(fill);
        barRow.appendChild(track);

        if (delta !== 0) {
          var deltaEl = document.createElement('span');
          deltaEl.className = 'metric-delta ' + (delta > 0 ? 'up' : 'down');
          deltaEl.textContent = formatDelta(delta);
          barRow.appendChild(deltaEl);
        }

        card.appendChild(barRow);
        container.appendChild(card);
      }
    }

    function renderIntroScreen() {
      var saved = safeLoadState();
      var canResume = !isEphemeralMode && hasInProgressSave(saved);

      el.introCopy.innerHTML = '';
      var p1 = document.createElement('p');
      p1.textContent = lesson.introSentences[0];
      var p2 = document.createElement('p');
      p2.className = 'intro-role';
      p2.textContent = lesson.introSentences[1];
      el.introCopy.appendChild(p1);
      el.introCopy.appendChild(p2);

      if (canResume) {
        el.btnResume.classList.remove('hidden');
        el.btnResume.textContent = 'Chơi tiếp (' + getResumeCardNumber(saved) + '/' + cards.length + ')';
        el.btnStart.className = 'btn btn-secondary';
        el.btnStart.textContent = 'Vào xóm (Ván mới)';
      } else {
        el.btnResume.classList.add('hidden');
        el.btnStart.className = 'btn btn-primary';
        el.btnStart.textContent = 'Vào xóm';
      }
    }

    function renderProgressDots(currentIdx) {
      el.progressDots.innerHTML = '';
      for (var i = 0; i < cards.length; i += 1) {
        var dot = document.createElement('span');
        dot.className = 'progress-dot';
        if (i < currentIdx) {
          dot.className += ' done';
        } else if (i === currentIdx) {
          dot.className += ' current';
        }
        el.progressDots.appendChild(dot);
      }
    }

    function updatePortrait(speaker) {
      var fallbackNode = el.portraitFrame.querySelector('.portrait-fallback');
      if (fallbackNode) {
        fallbackNode.remove();
      }
      el.speakerPortrait.classList.remove('hidden');
      el.speakerPortrait.src = speaker.portrait;
      el.speakerPortrait.srcset = speaker.portrait + ' 1x, ' + speaker.portrait2x + ' 2x';
      el.speakerPortrait.alt = 'Chân dung ' + speaker.name;
    }

    el.speakerPortrait.addEventListener('error', function () {
      el.speakerPortrait.classList.add('hidden');
      if (!el.portraitFrame.querySelector('.portrait-fallback')) {
        var fb = document.createElement('span');
        fb.className = 'portrait-fallback';
        fb.setAttribute('aria-hidden', 'true');
        fb.textContent = '👤';
        el.portraitFrame.appendChild(fb);
      }
    });

    function renderPlayScreen() {
      var cardIdx = getCurrentCardIndex();
      var card = cards[cardIdx];
      var speaker = characters[card.characterId];
      var isFeedback = state.phase === 'feedback';

      var computedScores;
      if (previewCardOffset !== null) {
        computedScores = createInitialScores(metrics);
        if (previewChoiceSide) {
          computedScores = applyChoiceToState(computedScores, card, previewChoiceSide);
        }
      } else {
        computedScores = computeStateFromChoices(state.choices, cards, metrics).scores;
      }

      var chosenSide = null;
      var activeDeltas = null;
      if (isFeedback) {
        chosenSide = previewCardOffset !== null ? previewChoiceSide : state.choices[cardIdx];
        if (chosenSide) {
          activeDeltas = (chosenSide === 'left' ? card.left : card.right).deltas;
        }
      }

      el.progressText.textContent = (cardIdx + 1) + '/' + cards.length;
      renderProgressDots(cardIdx);
      renderMetricsGrid(el.metricsGrid, computedScores, activeDeltas);

      el.cardLessonTag.textContent = card.lessonTag;
      el.cardCodeBadge.textContent = 'Thẻ ' + card.code;

      updatePortrait(speaker);
      el.speakerName.textContent = speaker.name;
      el.speakerRole.textContent = speaker.role;

      el.stampLabelLeft.textContent = card.left.label;
      el.stampLabelRight.textContent = card.right.label;
      resetCardDragVisuals();

      if (!isFeedback) {
        isChoiceLocked = false;
        el.phaseCard.classList.remove('hidden');
        el.phaseFeedback.classList.add('hidden');
        el.choiceButtons.classList.remove('hidden');
        el.btnNext.classList.add('hidden');
        el.btnPreviewSummary.classList.toggle('hidden', previewCardOffset === null);
        el.swipeHint.classList.remove('hidden');

        el.cardSituation.textContent = card.situation;
        el.btnLeftText.textContent = card.left.label;
        el.btnRightText.textContent = card.right.label;
        el.btnChoiceLeft.disabled = false;
        el.btnChoiceRight.disabled = false;
      } else {
        isChoiceLocked = true;
        el.btnChoiceLeft.disabled = true;
        el.btnChoiceRight.disabled = true;

        el.phaseCard.classList.add('hidden');
        el.phaseFeedback.classList.remove('hidden');
        el.choiceButtons.classList.add('hidden');
        el.btnNext.classList.remove('hidden');
        el.btnPreviewSummary.classList.toggle('hidden', previewCardOffset === null);
        el.swipeHint.classList.add('hidden');

        var branch = chosenSide === 'left' ? card.left : card.right;
        el.feedbackSituationEcho.textContent = '“' + card.situation + '”';
        el.chosenLabel.textContent = branch.label;
        el.feedbackText.textContent = branch.feedback;
        el.feedbackLessonName.textContent = card.lessonTag;

        el.deltaBadges.innerHTML = '';
        var deltaKeys = Object.keys(branch.deltas || {});
        for (var i = 0; i < deltaKeys.length; i += 1) {
          var key = deltaKeys[i];
          var val = branch.deltas[key];
          var metricObj = getMetricByKey(key);
          if (!metricObj || val === 0) {
            continue;
          }
          var chip = document.createElement('span');
          chip.className = 'delta-chip ' + (val > 0 ? 'up' : 'down');
          chip.textContent = metricObj.name + ' ' + formatDelta(val);
          el.deltaBadges.appendChild(chip);
        }

        if (card.characteristicId) {
          var charObj = getCharacteristicById(card.characteristicId);
          el.feedbackCharNote.textContent = 'Đã ghi nhận ô: ' + charObj.name;
          el.feedbackCharNote.classList.remove('hidden');
        } else {
          el.feedbackCharNote.classList.add('hidden');
        }

        if (previewCardOffset !== null) {
          var otherSideText = chosenSide === 'left' ? 'Phải' : 'Trái';
          el.btnNext.textContent = 'Chọn lại / Xem nhánh ' + otherSideText;
        } else {
          el.btnNext.textContent = cardIdx === cards.length - 1 ? 'Tiếp · Xem tổng kết' : 'Tiếp';
        }
      }
    }

    function renderCharacteristicDetail(charId) {
      var charObj = getCharacteristicById(charId) || lesson.characteristics[0];
      activeCharacteristicId = charObj.id;
      el.characteristicDetail.setAttribute('aria-labelledby', 'char-tab-' + charObj.id);

      el.characteristicDetail.innerHTML = '';

      var head = document.createElement('div');
      head.className = 'char-detail-head';
      attachIconWithFallback(head, charObj.icon, charObj.fallbackEmoji, 'char-detail-icon', 44);

      var textBox = document.createElement('div');
      var title = document.createElement('h3');
      title.className = 'char-detail-title';
      title.textContent = charObj.order + '. ' + charObj.name;
      var summary = document.createElement('p');
      summary.className = 'char-detail-summary';
      summary.textContent = charObj.summary;
      textBox.appendChild(title);
      textBox.appendChild(summary);
      head.appendChild(textBox);
      el.characteristicDetail.appendChild(head);

      var hasRealChoices = state.choices.length === cards.length;

      for (var i = 0; i < charObj.cardIds.length; i += 1) {
        var cId = charObj.cardIds[i];
        var cardIndex = cId - 1;
        var card = cards[cardIndex];
        var speaker = characters[card.characterId];

        var caseEl = document.createElement('div');
        caseEl.className = 'char-case';

        var sitEl = document.createElement('p');
        sitEl.className = 'char-case-situation';
        sitEl.textContent = 'Thẻ ' + card.code + ' · ' + speaker.name + ': “' + card.situation + '”';
        caseEl.appendChild(sitEl);

        if (hasRealChoices) {
          var side = state.choices[cardIndex] || 'left';
          var branch = side === 'left' ? card.left : card.right;

          var choiceEl = document.createElement('div');
          choiceEl.className = 'char-case-choice';
          choiceEl.textContent = 'Lựa chọn của bạn (' + (side === 'left' ? 'Trái' : 'Phải') + '): ' + branch.label;
          caseEl.appendChild(choiceEl);

          var dKeys = Object.keys(branch.deltas || {});
          var impactEl = document.createElement('div');
          impactEl.className = 'delta-badges';
          for (var k = 0; k < dKeys.length; k += 1) {
            var kKey = dKeys[k];
            var kVal = branch.deltas[kKey];
            var mObj = getMetricByKey(kKey);
            if (!mObj || kVal === 0) {
              continue;
            }
            var chip = document.createElement('span');
            chip.className = 'delta-chip ' + (kVal > 0 ? 'up' : 'down');
            chip.textContent = mObj.name + ' ' + formatDelta(kVal);
            impactEl.appendChild(chip);
          }
          if (impactEl.childNodes.length > 0) {
            caseEl.appendChild(impactEl);
          }

          var explainEl = document.createElement('p');
          explainEl.className = 'char-case-explain';
          explainEl.textContent = branch.feedback + ' ' + branch.explanation;
          caseEl.appendChild(explainEl);
        } else {
          // Chế độ trình chiếu mở thẳng 5 ô đặc trưng từ ?card=7 (chưa chơi đủ 10 thẻ)
          var leftRow = document.createElement('div');
          leftRow.className = 'review-choice-row';
          leftRow.textContent =
            '← Trái: ' + card.left.label + ' (' + formatDeltasInline(card.left.deltas, metrics) + ') — ' + card.left.feedback;
          caseEl.appendChild(leftRow);

          var rightRow = document.createElement('div');
          rightRow.className = 'review-choice-row';
          rightRow.textContent =
            'Phải →: ' + card.right.label + ' (' + formatDeltasInline(card.right.deltas, metrics) + ') — ' + card.right.feedback;
          caseEl.appendChild(rightRow);
        }

        el.characteristicDetail.appendChild(caseEl);
      }
    }

    function selectCharacteristicTab(charId, focusButton) {
      activeCharacteristicId = charId;
      renderSummaryScreen();
      if (focusButton) {
        var targetBtn = document.getElementById('char-tab-' + charId);
        if (targetBtn) {
          targetBtn.focus();
        }
      }
    }

    function renderSummaryScreen() {
      var computed = computeStateFromChoices(state.choices, cards, metrics);
      var hasFullRun = state.choices.length === cards.length;
      el.summaryStatusBadge.textContent = hasFullRun ? 'Hoàn thành 10/10 thẻ' : 'Chế độ trình chiếu · 5 đặc trưng';
      renderMetricsGrid(el.summaryMetricsGrid, computed.scores, null);

      el.characteristicsGrid.innerHTML = '';
      for (var i = 0; i < lesson.characteristics.length; i += 1) {
        var charObj = lesson.characteristics[i];
        var isSelected = charObj.id === activeCharacteristicId;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'char-tab-' + charObj.id;
        btn.className = 'char-tile' + (isSelected ? ' is-active' : '');
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        btn.setAttribute('aria-controls', 'characteristic-detail');
        btn.setAttribute('tabindex', isSelected ? '0' : '-1');
        btn.dataset.charId = charObj.id;

        var numSpan = document.createElement('span');
        numSpan.className = 'char-tile-num';
        numSpan.setAttribute('aria-hidden', 'true');
        numSpan.textContent = String(charObj.order);
        btn.appendChild(numSpan);

        attachIconWithFallback(btn, charObj.icon, charObj.fallbackEmoji, 'char-tile-icon', 36);

        var nameSpan = document.createElement('span');
        nameSpan.className = 'char-tile-name';
        nameSpan.textContent = charObj.shortName;
        btn.appendChild(nameSpan);

        (function (idx, id) {
          btn.addEventListener('click', function () {
            selectCharacteristicTab(id, false);
          });
          btn.addEventListener('keydown', function (ev) {
            var count = lesson.characteristics.length;
            var nextIdx = null;
            if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
              nextIdx = (idx + 1) % count;
            } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
              nextIdx = (idx - 1 + count) % count;
            } else if (ev.key === 'Home') {
              nextIdx = 0;
            } else if (ev.key === 'End') {
              nextIdx = count - 1;
            }
            if (nextIdx !== null) {
              ev.preventDefault();
              selectCharacteristicTab(lesson.characteristics[nextIdx].id, true);
            }
          });
        })(i, charObj.id);

        el.characteristicsGrid.appendChild(btn);
      }

      renderCharacteristicDetail(activeCharacteristicId);
    }

    function renderQuickReviewModal() {
      el.reviewModalBody.innerHTML = '';
      var hasFullRun = state.choices.length === cards.length;

      // 1. Khái niệm
      var conceptBlock = document.createElement('div');
      conceptBlock.className = 'review-block';
      var ch3 = document.createElement('h3');
      ch3.textContent = '1. Khái niệm kinh tế thị trường định hướng XHCN';
      var cp = document.createElement('p');
      cp.textContent = lesson.fullConcept;
      conceptBlock.appendChild(ch3);
      conceptBlock.appendChild(cp);
      el.reviewModalBody.appendChild(conceptBlock);

      // 2. Tính tất yếu khách quan
      var inevBlock = document.createElement('div');
      inevBlock.className = 'review-block';
      var ih3 = document.createElement('h3');
      ih3.textContent = '2. ' + lesson.inevitability.title;
      inevBlock.appendChild(ih3);

      var ul = document.createElement('ul');
      ul.className = 'review-list';
      for (var i = 0; i < lesson.inevitability.points.length; i += 1) {
        var pt = lesson.inevitability.points[i];
        var li = document.createElement('li');
        var strong = document.createElement('strong');
        strong.textContent = pt.heading + ': ';
        li.appendChild(strong);
        li.appendChild(document.createTextNode(pt.detail));
        ul.appendChild(li);
      }
      inevBlock.appendChild(ul);

      if (hasFullRun) {
        for (var j = 0; j < lesson.inevitability.cardIds.length; j += 1) {
          var idx = lesson.inevitability.cardIds[j] - 1;
          var card = cards[idx];
          var side = state.choices[idx] || 'left';
          var branch = side === 'left' ? card.left : card.right;
          var row = document.createElement('div');
          row.className = 'review-choice-row is-picked';
          var lbl = document.createElement('strong');
          lbl.textContent = 'Thẻ ' + card.code + ' · Bạn chọn: ' + branch.label;
          var exp = document.createElement('div');
          exp.textContent = branch.explanation;
          row.appendChild(lbl);
          row.appendChild(exp);
          inevBlock.appendChild(row);
        }
      }
      el.reviewModalBody.appendChild(inevBlock);

      // 3. Năm đặc trưng
      var charsBlock = document.createElement('div');
      charsBlock.className = 'review-block';
      var ch3Title = document.createElement('h3');
      ch3Title.textContent = hasFullRun ? '3. Năm đặc trưng trong ván của bạn' : '3. Năm đặc trưng trọng tâm';
      charsBlock.appendChild(ch3Title);

      for (var c = 0; c < lesson.characteristics.length; c += 1) {
        var item = lesson.characteristics[c];
        var rowC = document.createElement('div');
        rowC.className = 'review-choice-row';

        var heading = document.createElement('strong');
        heading.textContent = item.order + '. ' + item.name;
        rowC.appendChild(heading);

        var desc = document.createElement('div');
        desc.textContent = item.summary;
        rowC.appendChild(desc);

        if (hasFullRun) {
          for (var k = 0; k < item.cardIds.length; k += 1) {
            var cIdx = item.cardIds[k] - 1;
            var cCard = cards[cIdx];
            var cSide = state.choices[cIdx] || 'left';
            var cBranch = cSide === 'left' ? cCard.left : cCard.right;
            var picked = document.createElement('div');
            picked.style.marginTop = '4px';
            picked.textContent = '→ Thẻ ' + cCard.code + ': ' + cBranch.label + ' (' + cBranch.feedback + ')';
            rowC.appendChild(picked);
          }
        }

        charsBlock.appendChild(rowC);
      }
      el.reviewModalBody.appendChild(charsBlock);

      // 4. Chốt bài 1 phút (Thẻ 07): đối chiếu cả 2 nhánh Trái & Phải
      var wrapBlock = document.createElement('div');
      wrapBlock.className = 'review-block review-wrapup';
      var wh3 = document.createElement('h3');
      wh3.textContent = lesson.wrapUpCard7.promptTitle;
      wrapBlock.appendChild(wh3);

      var card7 = cards[6];
      var picked7 = hasFullRun ? state.choices[6] : null;
      var sit7 = document.createElement('p');
      sit7.textContent = 'Tình huống Cô Ba: “' + card7.situation + '”';
      wrapBlock.appendChild(sit7);

      var compareGrid = document.createElement('div');
      compareGrid.className = 'wrapup-compare-grid';

      var sides7 = ['left', 'right'];
      for (var s = 0; s < sides7.length; s += 1) {
        var sKey = sides7[s];
        var b7 = sKey === 'left' ? card7.left : card7.right;
        var optRow = document.createElement('div');
        optRow.className = 'review-choice-row' + (picked7 === sKey ? ' is-picked' : '');
        var optTitle = document.createElement('strong');
        optTitle.textContent =
          (sKey === 'left' ? 'Nhánh Trái: ' : 'Nhánh Phải: ') +
          b7.label +
          (picked7 === sKey ? ' [Bạn đã chọn]' : '');
        var optBody = document.createElement('div');
        optBody.textContent = formatDeltasInline(b7.deltas, metrics) + ' · ' + b7.feedback;
        optRow.appendChild(optTitle);
        optRow.appendChild(optBody);
        compareGrid.appendChild(optRow);
      }
      wrapBlock.appendChild(compareGrid);

      var qList = document.createElement('ul');
      qList.className = 'review-list';
      for (var q = 0; q < lesson.wrapUpCard7.questions.length; q += 1) {
        var qLi = document.createElement('li');
        qLi.textContent = lesson.wrapUpCard7.questions[q];
        qList.appendChild(qLi);
      }
      wrapBlock.appendChild(qList);
      el.reviewModalBody.appendChild(wrapBlock);
    }

    function render(options) {
      var opts = options || {};
      el.screenIntro.classList.toggle('hidden', state.screen !== 'intro');
      el.screenPlay.classList.toggle('hidden', state.screen !== 'play');
      el.screenSummary.classList.toggle('hidden', state.screen !== 'summary');

      if (state.screen === 'intro') {
        renderIntroScreen();
        if (opts.scrollTop) {
          resetScrollTop(el.screenIntro);
        }
      } else if (state.screen === 'play') {
        renderPlayScreen();
        if (opts.animateCard) {
          triggerClassAnimation(el.decisionCard, 'anim-card-in');
        }
        if (opts.animateFeedback) {
          triggerClassAnimation(el.phaseFeedback, 'anim-feedback-in');
        }
        if (opts.scrollTop) {
          resetScrollTop(el.screenPlay);
        }
      } else if (state.screen === 'summary') {
        renderSummaryScreen();
        if (opts.scrollTop) {
          resetScrollTop(el.screenSummary);
        }
      }
    }

    function startNewGame() {
      isEphemeralMode = false;
      previewCardOffset = null;
      previewChoiceSide = null;
      backupSummaryChoices = null;
      isChoiceLocked = false;
      state = {
        version: STORAGE_VERSION,
        screen: 'play',
        phase: 'card',
        choices: []
      };
      activeCharacteristicId = lesson.characteristics[0].id;
      safeSaveState();
      render({ animateCard: true, scrollTop: true });
    }

    function requestRestartFromHud(triggerEl) {
      if (previewCardOffset !== null || state.choices.length === 0) {
        startNewGame();
        return;
      }
      lastModalTrigger = triggerEl || el.btnRestartTop;
      var cardNum = getCurrentCardIndex() + 1;
      el.confirmModalDesc.textContent =
        'Bạn đang ở Thẻ ' +
        cardNum +
        '/' +
        cards.length +
        '. Nếu bắt đầu ván mới, tiến độ hiện tại sẽ đặt lại về Thẻ 01 và bốn chỉ số về 50/100.';
      el.confirmModal.classList.remove('hidden');
      syncBodyModalLock();
      el.btnCancelRestart.focus();
    }

    function closeConfirmModal(restoreFocus) {
      el.confirmModal.classList.add('hidden');
      syncBodyModalLock();
      if (restoreFocus && lastModalTrigger && typeof lastModalTrigger.focus === 'function') {
        lastModalTrigger.focus();
      }
    }

    function resumeSavedGame() {
      var saved = safeLoadState();
      if (!saved || !hasInProgressSave(saved)) {
        startNewGame();
        return;
      }
      isEphemeralMode = false;
      previewCardOffset = null;
      previewChoiceSide = null;
      backupSummaryChoices = null;
      state = saved;
      if (state.screen === 'intro') {
        state.screen = 'play';
      }
      isChoiceLocked = state.phase === 'feedback';
      safeSaveState();
      render({ animateCard: true, scrollTop: true });
    }

    function openCard7PresenterFromSummary() {
      if (state.choices.length === cards.length) {
        backupSummaryChoices = state.choices.slice();
      }
      isEphemeralMode = true;
      previewCardOffset = 6; // Thẻ 07
      previewChoiceSide = null;
      isChoiceLocked = false;
      state = {
        version: STORAGE_VERSION,
        screen: 'play',
        phase: 'card',
        choices: []
      };
      render({ animateCard: true, scrollTop: true });
    }

    function openSummaryFromPreview() {
      previewCardOffset = null;
      previewChoiceSide = null;
      isChoiceLocked = false;
      if (backupSummaryChoices && backupSummaryChoices.length === cards.length) {
        isEphemeralMode = false;
        state = {
          version: STORAGE_VERSION,
          screen: 'summary',
          phase: 'card',
          choices: backupSummaryChoices.slice()
        };
      } else {
        isEphemeralMode = true;
        state = {
          version: STORAGE_VERSION,
          screen: 'summary',
          phase: 'card',
          choices: []
        };
      }
      activeCharacteristicId = lesson.characteristics[0].id;
      render({ scrollTop: true });
    }

    // Một đường xử lý duy nhất cho nút bấm, bàn phím và thao tác quẹt
    function commitChoice(side, fromKeyboard) {
      if (state.screen !== 'play' || state.phase !== 'card' || isChoiceLocked) {
        return;
      }
      if (side !== 'left' && side !== 'right') {
        return;
      }

      isChoiceLocked = true;
      el.btnChoiceLeft.disabled = true;
      el.btnChoiceRight.disabled = true;

      if (previewCardOffset !== null) {
        previewChoiceSide = side;
        state.phase = 'feedback';
        render({ animateFeedback: true });
        if (fromKeyboard) {
          el.btnNext.focus({ preventScroll: true });
        }
        return;
      }

      var currentIdx = getCurrentCardIndex();
      if (state.choices.length > currentIdx) {
        return;
      }

      state.choices.push(side);
      state.phase = 'feedback';
      safeSaveState();
      render({ animateFeedback: true });
      if (fromKeyboard) {
        el.btnNext.focus({ preventScroll: true });
      }
    }

    function advanceNext() {
      if (state.screen !== 'play' || state.phase !== 'feedback') {
        return;
      }

      if (previewCardOffset !== null) {
        previewChoiceSide = null;
        state.phase = 'card';
        isChoiceLocked = false;
        render({ animateCard: true });
        return;
      }

      if (state.choices.length >= cards.length) {
        state.screen = 'summary';
        state.phase = 'card';
        isChoiceLocked = false;
        activeCharacteristicId = lesson.characteristics[0].id;
        safeSaveState();
        render({ scrollTop: true });
        return;
      }

      state.phase = 'card';
      isChoiceLocked = false;
      safeSaveState();
      render({ animateCard: true });
    }

    function openQuickReview() {
      lastModalTrigger = el.btnOpenReview;
      renderQuickReviewModal();
      el.reviewModal.classList.remove('hidden');
      el.reviewModalBody.scrollTop = 0;
      syncBodyModalLock();
      el.btnCloseReview.focus();
    }

    function closeQuickReview() {
      el.reviewModal.classList.add('hidden');
      syncBodyModalLock();
      if (state.screen === 'summary') {
        el.btnOpenReview.focus();
      }
    }

    function trapModalTabKey(modalEl, ev) {
      if (ev.key !== 'Tab') {
        return;
      }
      var focusables = modalEl.querySelectorAll(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) {
        return;
      }
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    }

    // Kéo quẹt thẻ (Pointer Events + bảo vệ touchmove cho WebView cũ)
    var drag = {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      dx: 0,
      dy: 0,
      horizontal: false
    };

    function resetCardDragVisuals() {
      el.decisionCard.classList.remove('is-dragging');
      el.decisionCard.style.transform = '';
      el.swipeStampLeft.style.opacity = '0';
      el.swipeStampRight.style.opacity = '0';
      el.btnChoiceLeft.classList.remove('is-highlighted');
      el.btnChoiceRight.classList.remove('is-highlighted');
    }

    el.decisionCard.addEventListener('pointerdown', function (e) {
      if (state.screen !== 'play' || state.phase !== 'card' || isChoiceLocked) {
        return;
      }
      if (e.button && e.button !== 0) {
        return;
      }
      drag.active = true;
      drag.pointerId = e.pointerId;
      drag.startX = e.clientX;
      drag.startY = e.clientY;
      drag.dx = 0;
      drag.dy = 0;
      drag.horizontal = false;
    });

    el.decisionCard.addEventListener('pointermove', function (e) {
      if (!drag.active || e.pointerId !== drag.pointerId) {
        return;
      }
      drag.dx = e.clientX - drag.startX;
      drag.dy = e.clientY - drag.startY;

      if (!drag.horizontal) {
        if (Math.abs(drag.dy) > 10 && Math.abs(drag.dy) >= Math.abs(drag.dx)) {
          // Vuốt dọc: trả quyền cuộn lại cho trình duyệt
          drag.active = false;
          resetCardDragVisuals();
          return;
        }
        if (Math.abs(drag.dx) > 12 && Math.abs(drag.dx) > Math.abs(drag.dy)) {
          drag.horizontal = true;
          el.decisionCard.classList.add('is-dragging');
          if (typeof el.decisionCard.setPointerCapture === 'function') {
            try {
              el.decisionCard.setPointerCapture(e.pointerId);
            } catch (err) {
              // Ignore if capture is unsupported
            }
          }
        }
      }

      if (drag.horizontal) {
        var clampedX = Math.max(-160, Math.min(160, drag.dx));
        var rotateDeg = clampedX * 0.04;
        el.decisionCard.style.transform = 'translateX(' + clampedX + 'px) rotate(' + rotateDeg + 'deg)';

        var ratio = Math.min(1, Math.abs(drag.dx) / SWIPE_THRESHOLD_PX);
        if (drag.dx < 0) {
          el.swipeStampLeft.style.opacity = String(ratio);
          el.swipeStampRight.style.opacity = '0';
          el.btnChoiceLeft.classList.toggle('is-highlighted', Math.abs(drag.dx) >= SWIPE_THRESHOLD_PX);
          el.btnChoiceRight.classList.remove('is-highlighted');
        } else {
          el.swipeStampRight.style.opacity = String(ratio);
          el.swipeStampLeft.style.opacity = '0';
          el.btnChoiceRight.classList.toggle('is-highlighted', Math.abs(drag.dx) >= SWIPE_THRESHOLD_PX);
          el.btnChoiceLeft.classList.remove('is-highlighted');
        }
      }
    });

    el.decisionCard.addEventListener(
      'touchmove',
      function (e) {
        if (drag.active && drag.horizontal && e.cancelable) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    function finishDrag(e, cancelled) {
      if (!drag.active || e.pointerId !== drag.pointerId) {
        return;
      }
      var wasHorizontal = drag.horizontal;
      var finalDx = drag.dx;
      var finalDy = drag.dy;

      drag.active = false;
      drag.horizontal = false;
      if (typeof el.decisionCard.releasePointerCapture === 'function') {
        try {
          if (el.decisionCard.hasPointerCapture(e.pointerId)) {
            el.decisionCard.releasePointerCapture(e.pointerId);
          }
        } catch (err) {
          // Ignore
        }
      }
      resetCardDragVisuals();

      if (wasHorizontal) {
        suppressClickUntil = Date.now() + 260;
        if (!cancelled && Math.abs(finalDx) >= SWIPE_THRESHOLD_PX && Math.abs(finalDx) > Math.abs(finalDy)) {
          commitChoice(finalDx < 0 ? 'left' : 'right', false);
        }
      }
    }

    el.decisionCard.addEventListener('pointerup', function (e) {
      finishDrag(e, false);
    });

    el.decisionCard.addEventListener('pointercancel', function (e) {
      finishDrag(e, true);
    });

    // Nút bấm
    el.btnStart.addEventListener('click', startNewGame);
    el.btnResume.addEventListener('click', resumeSavedGame);

    el.btnHome.addEventListener('click', function () {
      var wasEphemeral = isEphemeralMode;
      isEphemeralMode = false;
      previewCardOffset = null;
      previewChoiceSide = null;
      backupSummaryChoices = null;
      if (wasEphemeral) {
        var saved = safeLoadState();
        state = {
          version: STORAGE_VERSION,
          screen: 'intro',
          phase: saved ? saved.phase : 'card',
          choices: saved ? saved.choices : []
        };
      } else {
        state.screen = 'intro';
        safeSaveState();
      }
      render({ scrollTop: true });
    });

    el.btnRestartTop.addEventListener('click', function () {
      requestRestartFromHud(el.btnRestartTop);
    });

    el.btnCancelRestart.addEventListener('click', function () {
      closeConfirmModal(true);
    });

    el.btnConfirmRestart.addEventListener('click', function () {
      closeConfirmModal(false);
      startNewGame();
    });

    el.confirmModal.addEventListener('click', function (e) {
      if (e.target === el.confirmModal) {
        closeConfirmModal(true);
      }
    });

    el.btnReplay.addEventListener('click', startNewGame);
    el.btnPresentCard7.addEventListener('click', openCard7PresenterFromSummary);
    el.btnPreviewSummary.addEventListener('click', openSummaryFromPreview);

    el.btnChoiceLeft.addEventListener('click', function () {
      if (Date.now() < suppressClickUntil) {
        return;
      }
      commitChoice('left', false);
    });

    el.btnChoiceRight.addEventListener('click', function () {
      if (Date.now() < suppressClickUntil) {
        return;
      }
      commitChoice('right', false);
    });

    el.btnNext.addEventListener('click', advanceNext);
    el.btnOpenReview.addEventListener('click', openQuickReview);
    el.btnCloseReview.addEventListener('click', closeQuickReview);
    el.btnCloseReviewBottom.addEventListener('click', closeQuickReview);

    el.reviewModal.addEventListener('click', function (e) {
      if (e.target === el.reviewModal) {
        closeQuickReview();
      }
    });

    // Bàn phím & quản lý modal
    document.addEventListener('keydown', function (e) {
      if (!el.confirmModal.classList.contains('hidden')) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeConfirmModal(true);
          return;
        }
        trapModalTabKey(el.confirmModal, e);
        return;
      }

      if (!el.reviewModal.classList.contains('hidden')) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeQuickReview();
          return;
        }
        trapModalTabKey(el.reviewModal, e);
        return;
      }

      if (state.screen !== 'play') {
        return;
      }
      if (state.phase === 'card' && !isChoiceLocked) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          commitChoice('left', true);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          commitChoice('right', true);
        }
      } else if (state.phase === 'feedback') {
        if (e.key === 'Enter' || e.key === ' ') {
          var activeTag = document.activeElement ? document.activeElement.tagName : '';
          if (activeTag !== 'BUTTON') {
            e.preventDefault();
            advanceNext();
          }
        }
      }
    });

    // Hỗ trợ tham số URL cho buổi thuyết trình & đối chiếu nhanh
    function applyQueryOrSavedState() {
      var params = new URLSearchParams(window.location.search);
      var preset = params.get('preset');
      var cardParam = params.get('card');

      if (preset === 'all-left' || preset === 'all-right') {
        isEphemeralMode = true;
        var fillSide = preset === 'all-left' ? 'left' : 'right';
        var arr = [];
        for (var i = 0; i < cards.length; i += 1) {
          arr.push(fillSide);
        }
        state = {
          version: STORAGE_VERSION,
          screen: 'summary',
          phase: 'card',
          choices: arr
        };
        render({ scrollTop: true });
        return;
      }

      if (cardParam) {
        var num = parseInt(cardParam, 10);
        if (!isNaN(num) && num >= 1 && num <= cards.length) {
          isEphemeralMode = true;
          previewCardOffset = num - 1;
          previewChoiceSide = null;
          state = {
            version: STORAGE_VERSION,
            screen: 'play',
            phase: 'card',
            choices: []
          };
          render({ animateCard: true, scrollTop: true });
          return;
        }
      }

      var saved = safeLoadState();
      if (saved && saved.screen !== 'intro') {
        state = saved;
      } else {
        state = {
          version: STORAGE_VERSION,
          screen: 'intro',
          phase: 'card',
          choices: []
        };
      }
      render({ scrollTop: true });
    }

    applyQueryOrSavedState();
    preloadGameAssets();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  }

  var engineApi = {
    STORAGE_KEY: STORAGE_KEY,
    STORAGE_VERSION: STORAGE_VERSION,
    INITIAL_SCORE: INITIAL_SCORE,
    SWIPE_THRESHOLD_PX: SWIPE_THRESHOLD_PX,
    clampScore: clampScore,
    createInitialScores: createInitialScores,
    applyChoiceToState: applyChoiceToState,
    computeStateFromChoices: computeStateFromChoices,
    getCollectedCharacteristics: getCollectedCharacteristics,
    sanitizeSavedState: sanitizeSavedState
  };

  if (typeof window !== 'undefined') {
    window.DIEU_HANH_XOM_ENGINE = engineApi;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = engineApi;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
