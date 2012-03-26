(function () {
  var levels = [
    { notes: 1, scale: [0, 4, 7, 12] },
    { notes: 2, scale: [0, 3, 6, 8, 12] },
    { notes: 2, scale: [0, 2, 4, 7, 11, 12, 14] },
    { notes: 3, scale: [0, 1, 4, 5, 7, 8, 10, 12] },
    { notes: 4, scale: [0, 2, 4, 5, 7, 9, 11, 12, 14] }
  ];
  var level = 0;
  var score = 10;
  var scale;
  var chosenIndexes;
  var numberOfNotes = 15;

  $(setup);

  function setup() {
    setupButtons();
    updateScore(0);
    restart();
  }

  window.restart = restart;

  function restart(override) {
    level = Math.floor(score / 50); //Increase level every 50 points
    level = Math.max(0, level); //Keep level positive
    level = Math.min(level, levels.length - 1); //Cap level at top
    if (override) {
      level = override;
    }
    updateScore(0);
    scale = levels[level].scale;
    audio.setupTones(scale);
    var numberOfNotes = levels[level].notes;
    chosenIndexes = pickDistinct(scale.length, numberOfNotes);
    setupBoxes(scale.length);
    $('#target .boxes .box').click(); //click to remove
    var boxWidth = $('#scale .boxes .box').width();
    $('#target .boxes').width(numberOfNotes * (boxWidth + 10));
  }

  function setupButtons() {
    var $playAll = $('#playAll');
    var $stop = $('#stop').hide();
    var $playClue = $('#playClue');
    var $playGuess = $('#playGuess');


    $playAll.click(function () {
      updateScore(-4);
      playAll(function () {
        $playAll.show();
        $stop.hide();
      });
      $stop.show();
      $playAll.hide();
    });

    $stop.click(function () {
      audio.stop();
      $('#scale .boxes .box').removeClass('active');
      $playAll.show();
      $stop.hide();
    });

    $playClue.click(function () {
      audio.play(chosenIndexes, function () {
        $('#clue').addClass('playing');
      }, function () {
        $('#clue').removeClass('playing');
      });
    });

    $playGuess.click(function () {
      var guessedIndexes = $('#target .box').map(function () {
        return $(this).data('scale-index');
      }).toArray();
      if (guessedIndexes.length) {
        updateScore(-2);
        audio.playGuess(guessedIndexes, function () {
          $('#target').addClass('playing');
        }, function () {
          $('#target').removeClass('playing');
        });
        winning(guessedIndexes);
      }
    });
  }

  function updateScore(by) {
    score += by;
    $('#score').text(score);
    $('#level').text(level);
  }

  function winning(guessedIndexes) {
    chosenIndexes.sort();
    guessedIndexes.sort();

    if (chosenIndexes.toString() == guessedIndexes.toString()) {
      updateScore((level * 2) + 12);
      alert('W00t!!!\nClick OK continue.');
      restart();
    }
  }

  function setupBoxes(count) {
    $('#target .boxes').off();
    $('#clue .boxes').empty();
    var $boxes = $('#scale .boxes').empty();
    var $box;
    var hue;
    var saturation;
    var octave;
    for (var i = 0; i < numberOfNotes; i++) {
      $box = $('<span>').attr('class', 'box box-' + i);
      $box.attr('data-index', i);
      hue = (360 / 12) * i
      octave = Math.floor(i / 12);
      saturation = (octave === 0) ? 80 : 60;
      $box.css('background-color', "hsla(" + hue + ", " + saturation + "%, 50%, 1)");
      $boxes.append($box);
      if (scale.indexOf(i) > -1) { //this is a note
        $box.attr('data-scale-index', scale.indexOf(i));
        $box.addClass('in-scale');
        $box.attr('draggable', 'true');
        $box.on('dragstart', function (e) {
          e.originalEvent.dataTransfer.effectAllowed = 'move';
          e.originalEvent.dataTransfer.setData('Text', $(this).attr('data-index'));
        });
        $box.click(function () {
          updateScore(-1);
          var scaleIndex = $(this).data('scale-index');
          playAndHighlight(scaleIndex);
        });
      }
    }

    for (var i = 0; i < chosenIndexes.length; i++) {
      $('#clue .boxes').append('<div class="box"><p>?</p></div>');
    }

    $('#target .boxes').on('dragover', function (e) {
      e.preventDefault(); // allows us to drop
      $(this).addClass('over');
      e.originalEvent.dataTransfer.dropEffect = 'move';
    });

    $('#target .boxes').on('dragleave', function (e) {
      $(this).removeClass('over');
    });

    $('#target .boxes').on('drop', function (e) {
      e.preventDefault();
      $(this).removeClass('over');
      var index = e.originalEvent.dataTransfer.getData('Text');
      var $el = $('#scale .boxes .box[data-index=' + index + ']');
      var $newEl = $el.clone();
      $el.addClass('fade');
      $el.attr('draggable', 'false');

      $(this).append($newEl);

      if ($('#target .boxes .box').length > chosenIndexes.length) {
        $('#target .boxes .box:first-child').click(); //click to remove
      }
    });

    $('#target .boxes').on('click', '.box', function () {
      var index = $(this).attr('data-index');
      $(this).remove();
      var $el = $('#scale .boxes .box[data-index=' + index + ']');
      $el.attr('draggable', 'true');
      $el.removeClass('fade');
    });
  }

  function playAll(allDone) {
    var index = 0;

    function playNext() {
      if (index < scale.length) {
        playAndHighlight(index, playNext);
        index++;
      } else {
        allDone && allDone();
      }
    }
    playNext();
  }

  function playAndHighlight(index, callback) {
    var $box = $('#scale .boxes [data-scale-index=' + index + ']');
    audio.play(index, function () {
      $box.addClass('active');
    }, function () {
      $box.removeClass('active');
      callback && callback();
    });
  }

  function pickDistinct(max, count) {
    var choices = [];
    var choice;
    while (true) {
      choice = Math.floor(Math.random() * max);
      if (choices.indexOf(choice) == -1) {
        choices.push(choice);
      }
      if (choices.length === count) {
        return choices;
      }
    }
  }
})();
