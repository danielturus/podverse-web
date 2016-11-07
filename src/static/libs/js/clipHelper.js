import { previewEndTime, previewStartTime } from './mediaPlayer.js';
import { convertHHMMSSToSeconds, convertSecToHHMMSS, isHHMMSS,
         isInt, isUUID } from './utility.js';

export function initClipper () {

  $('#make-clip-start-time i').on('click', function () {
    var startTime = $('#make-clip-start-time input').val() || "0";
    var endTime = $('#make-clip-end-time input').val();
    startTime = convertHHMMSSToSeconds(startTime);
    endTime = convertHHMMSSToSeconds(endTime);
    previewStartTime(startTime, endTime);
  });

  $('#make-clip-end-time i').on('click', function () {
    var endTime = $('#make-clip-end-time input').val() || "3";
    endTime = convertHHMMSSToSeconds(endTime);
    previewEndTime(endTime);
  });

  $('#make-clip-time-set').on('click', function () {
    var currentTimeHHMMSS = convertSecToHHMMSS(Math.floor(audio.currentTime));
    var currentSetMode = $('#make-clip-time-set').html();
    if (currentSetMode === 'Set Start') {
      $('#make-clip-start-time input').val(currentTimeHHMMSS);
      $('#make-clip-end-time input').focus();
      $('#make-clip-time-set').html('Set End');
    } else if (currentSetMode === 'Set End') {
      $('#make-clip-end-time input').val(currentTimeHHMMSS);
      $('#make-clip-time-set').html('Set Start');
      $('#make-clip-description textarea').focus();
    }
  });

  $('#player').on('mousedown', function (e) {
    e.preventDefault();
  });

  $('#make-clip-time-set').on('mousedown', function (e) {
    e.preventDefault();
  });

  $('#make-clip-time-back').on('mousedown', function (e) {
    e.preventDefault();
  });

  $('#make-clip-time-forwards').on('mousedown', function (e) {
    e.preventDefault();
  });

  $('#make-clip-time-back').on('click', function () {
    audio.currentTime = audio.currentTime - 15;
  });

  $('#make-clip-time-forwards').on('click', function () {
    audio.currentTime = audio.currentTime + 15;
  });

}

export function setStartTime () {
  $('#make-clip-start-time input').val(convertSecToHHMMSS(Math.floor(audio.currentTime)));
  $('#make-clip-end-time input').focus();
}

export function setEndTime () {
  $('#make-clip-end-time input').val(convertSecToHHMMSS(Math.floor(audio.currentTime)));
  $('#make-clip-description textarea').focus();
}

export function toggleMakeClipWidget (_this) {
  if ($('#add-to-playlist').css('display') !== 'block' && $('#recommend').css('display') !== 'block') {
    $('#player-stats').toggle();
    $('#player-description').hide();
    $('#player-episode-image').toggle();
  }

  if ($(_this).hasClass('active')) {
    $('#player-description').show();
  }

  $('#add-to-playlist').hide();
  $('#toggle-playlist-btn').removeClass('active');

  $('#recommend').hide();
  $('#toggle-recommend-btn').removeClass('active');

  $('#toggle-make-clip-btn').toggleClass('active');
  $('#make-clip').toggle();
}

export function makeClip () {
  event.preventDefault();

  if (!isUUID(window.podcastId)) {
    alert('errrror');
    return;
  }

  if (!isInt(window.episodeId)) {
    alert('errrror');
    return;
  }

  $('#make-clip-start-time-error').hide();
  $('#make-clip-end-time-error').hide();
  $('#make-clip-start-time').removeClass('has-danger');
  $('#make-clip-end-time').removeClass('has-danger');
  $('#make-clip-time').removeClass('has-danger');

  var startTime = $('#make-clip-start-time input').val(),
      endTime = $('#make-clip-end-time input').val();

  if (startTime === '' && endTime === '') {
    $('#make-clip-start-time-error').html('Type a start time and/or end time to create a clip.');
    $('#make-clip-time').addClass('has-danger');
    $('#make-clip-start-time-error').show();
    return;
  }

  if (!isHHMMSS(startTime) && startTime !== '') {
    $('#make-clip-start-time-error').html('Type time in hh:mm:ss format.');
    $('#make-clip-start-time').addClass('has-danger');
    $('#make-clip-start-time-error').show();
    return;
  }

  if (!isHHMMSS(endTime) && endTime !== '') {
    $('#make-clip-end-time-error').html('Type time in hh:mm:ss format.');
    $('#make-clip-end-time').addClass('has-danger');
    $('#make-clip-end-time-error').show();
    return;
  }

  startTime = convertHHMMSSToSeconds(startTime);
  endTime = convertHHMMSSToSeconds(endTime);

  if (endTime === 0) {
    endTime = null;
  }

  if (startTime === endTime) {
    $('#make-clip-start-time-error').html('Start time and end time cannot be the same.');
    $('#make-clip-start-time').addClass('has-danger');
    $('#make-clip-end-time').addClass('has-danger');
    $('#make-clip-start-time-error').show();
    return;
  }

  if (endTime !== null && endTime <= startTime) {
    $('#make-clip-start-time-error').html('End time cannot be earlier than start time.');
    $('#make-clip-start-time').addClass('has-danger');
    $('#make-clip-end-time').addClass('has-danger');
    $('#make-clip-start-time-error').show();
    return;
  }

  // TODO: how can we prevent malicious scripts in the description?
  var description = $('#make-clip-description textarea').val();

  // TODO: set owner name based on ownerId
  var ownerName = 'random owner name';

  // TODO: handle auth to post clip
  $.ajax({
    type: 'POST',
    url: '/clips',
    headers: {
      Authorization: $.cookie('idToken')
    },
    data: {
      episode: {
        id: episodeId,
        podcast: {
          id: podcastId
        }
      },
      startTime: startTime,
      endTime: endTime,
      description: description,
      ownerName: ownerName
    },
    success: function (response) {
      if (window.isPlayerPage) {
        toggleMakeClipWidget();
        $('#make-clip-start-time').val('');
        $('#make-clip-end-time').val('');
        $('#make-clip-description').val('');
        $('#clip-created-modal-link').val(location.protocol + '\/\/' + location.hostname + (location.port ? ':'+location.port: '')  + '\/clips\/' + response.id);
        $('#clip-created-modal').modal('show');
      } else {
        location.href = '\/clips\/' + response.id;
      }
    },
    error: function (xhr, status, error) {
      // TODO: add more helpful error messaging
      alert('errrror');
    }

  });

  // TODO: view my clips

  // TODO: edit my clips

  // TODO: add CSRF security
}