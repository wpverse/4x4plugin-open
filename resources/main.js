jQuery(document).ready(function() {
  var  gridContainer = document.getElementById('matrix-container');
  if (gridContainer){

    console.log('Main.js Loaded');
    var activeTodo = '';
    var editFormHasBeenChanged = '';
    var editFormTryAjaxAgain = '';
    var newFormStatus = '';
    var newFormTryAjaxAgain = '';
    var updateFiltersStatus = '';
    var updateFiltersTryAjaxAgain = '';
    var todoElement = '';
    var toDoBacklogArea = document.getElementById('todo-backlog-area');
    var urgentImportant = document.getElementById('urgent-important');
    var notUrgentImportant = document.getElementById('not-urgent-important');
    var urgentNotImportant = document.getElementById('urgent-not-important');
    var notUrgentNotImportant = document.getElementById('not-urgent-not-important');
    var todoDoneArea = document.getElementById('todo-done-area');
    var labelFilter = '';
    var dateFilter = '';


    userId = jQuery('#matrix-container').data('userid');

    if(userId == false || userId == null){
      displayNotice('You are not Logged-in. Please login to make changes.','User not logged-in');
    } else {
      displayNotice(null,'makeBoardDraggable()');
      makeBoardDraggable();
      displayNotice(null,'trying to unlock edit form');
      unlockEditForm();
      unlockNewForm();
    }

    containerSetup();

    function containerSetup(){
      gridQuadHeight = gridContainer.getBoundingClientRect().width * .35;
      extraAreasHeight = gridContainer.getBoundingClientRect().width * .2;
      toDoBacklogArea.style.height = extraAreasHeight+'px';
      urgentImportant.style.height = gridQuadHeight+'px';
      notUrgentImportant.style.height = gridQuadHeight+'px';
      urgentNotImportant.style.height = gridQuadHeight+'px';
      notUrgentNotImportant.style.height = gridQuadHeight+'px';
      todoDoneArea.style.height = extraAreasHeight+'px';
    }

    setResizeListeners();

    repositionAllFromSavedPercentage();

    function makeBoardDraggable(){
      if (!userId){

      } else {
        var dragContainer = document.getElementById('matrix-container');
        interact('.draggable')
        .draggable({
          inertia: true,
          restrict: {
           restriction: dragContainer,
           endOnly: true,
           elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
         },
         autoScroll: true,
         onmove: dragMoveListener,
         onend: function (event) {
           console.log(event.target.dataset.postid);
           ajaxUpdatePosition(event.target.dataset.postid,event.target.dataset.xpos,event.target.dataset.ypos);
         }
       });
      }

    }


    function dragMoveListener(event) {
      var target = event.target,
      x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
      y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
      target.style.webkitTransform =
      target.style.transform =
      'translate(' + x + 'px, ' + y + 'px)';
      target.setAttribute('data-x', x);
      target.setAttribute('data-y', y);
      var gridH = jQuery('#matrix-container').height();
      var gridW = jQuery('#matrix-container').width();
      console.log('x: '+x+' y: '+y );
      console.log('gridH: '+gridH+' gridW: '+gridW );
      var xpos = (x / gridW) * 100;
      var ypos = (y / gridH) * 100;
      target.setAttribute('data-xpos', xpos);
      target.setAttribute('data-ypos', ypos);
      updateWhatsCurrentlyActive(event.target);
    }
    window.dragMoveListener = dragMoveListener;

    jQuery('.grid-quad').click(function(){
      selectNone();
    });

    jQuery('.drag-todo').click(function(){


      if(userId == false || userId == null){
        displayNotice('You are not Logged-in. Please login to make changes.','User not logged-in');
        return;
      }
      console.log(this);
      var setActive = updateWhatsCurrentlyActive(this);
      console.log(setActive);

      /*
      return setActive.then(function(result){
        console.log('result of setActive:'+result);
        return result;
      });
      */

    });

    jQuery('#edit_pm_submit').click(function(e){
      e.preventDefault();
      e.stopPropagation();
      if (saveUpdateFormContents()){
        selectNone();
        clearFormEdit();
      } else {
        displayNotice('saveUpdateFormContents() failed. Keeping current selection', 'error returned from saveUpdateFormContents()');
      }
    });

    jQuery('#pm-form-edit-todo-panel input, #pm-form-edit-todo-panel select').on( 'input', function() {
      console.log('edit form change');

      editFormHasBeenChanged = 'changed';
    });

    jQuery('#new_pm_submit').click(function(e){
      e.preventDefault();
      e.stopPropagation();
      if(!jQuery('#new-todo-title').val()){
        jQuery('#new-todo-title').addClass('alert-danger').delay('200').removeClass('alert-danger');
      }

      console.log('trying ajaxNewTodo()');
      var newTodoResult = ajaxNewTodo();
      newTodoResult.then(function(result){
        console.log('newTodoResult');
        console.log(newTodoResult);
        selectNone();
        clearFormNew(); 
      });



    });

    function selectNone(){
      console.log('Click.. :remove ACTIVE');
      jQuery('.drag-todo').removeClass('active');
      jQuery(".drag-todo .remove").removeClass('removal');
      updateWhatsCurrentlyActive();
      lockEditForm();
    }


    function saveUpdateFormContents(){
      displayNotice(null,'doing save UpdateFormContents()');
      todoElement = document.getElementById(activeTodo);
      if(!todoElement){
        displayNotice(null,'ajaxUpdateContent failed. No currently selected item');
        return false;
      }
      var p = ajaxUpdateContent();
      return p.then(function(result){
        if (result == false){
          displayNotice(null,'level 2 fail');
          console.log(result);
        }
        return result;
      });
    }




    function ajaxUpdatePosition(postId,xpos,ypos){
      console.log('ajaxUpdatePosition(postId,xpos,ypos)');
      var ajax_data = {
        action: 'pm_update_position',
        user_id : userId,
        post_id : postId,
        xpos: xpos,
        ypos: ypos
      }
      var mod_url = ajax_url+'pm_update_position';
      jQuery.post( mod_url, ajax_data, function(data){
        var reply = jQuery( data ).find('data').text();
        var status = jQuery( data ).find('status').text();
        console.log('reply');
        console.log(reply);
        console.log('status');
        console.log(status);
        if(status){
         console.log('inner- position updated');
         jQuery('#post-updated').stop().fadeIn(300).fadeOut(1000);
         var targetTodoId = '#drag-' + postId + ' .update-border';
         jQuery(targetTodoId).fadeIn(100).fadeOut(600);
         return true;
       } else {
         console.log('inner- position update failed!');
         displayNotice('Couldn\'t save position to server','ajax position server update failed!');
         return false;
       }
     });
    }


    function ajaxUpdateContent(){
      displayNotice(null,'doing ajax Update Content()');
      
      if(!userId){
        displayNotice(null,'Not saving. User not logged-in');
        return false;
      }
      todoElement = document.getElementById(activeTodo);
      var wpPostId = todoElement.dataset.postid;

      var postId = 'drag-'+jQuery('#post_id').val();
      var pmTitle = jQuery('#edit-todo-title').val();
      var pmFilter = jQuery('select#todo-label').val();

      jQuery('#'+activeTodo+' .pm-todo-label').removeClass('unlabeled filter-one filter-two filter-three');
      jQuery('#'+activeTodo+' .pm-todo-label').addClass(pmFilter).data('label',pmFilter);
      jQuery('#'+activeTodo).removeClass('unlabeled filter-one filter-two filter-three');
      jQuery('#'+activeTodo).addClass(pmFilter);
      jQuery('#'+activeTodo+' .todo-title').html(pmTitle)

      displayNotice(null,'starting ajax content update');


      var ajax_data = {
        action: 'pm_update_todo',
        post_id : wpPostId,
        user_id : userId,
        title : pmTitle,
        pm_filter : pmFilter,
      }

      var mod_url = ajax_url+'pm_update_todo';
      var savingEdit = jQuery.post( mod_url, ajax_data, function(data){
        var reply = jQuery( data ).find('data').text();
        var status = jQuery( data ).find('status').text();
        console.log('All:');
        console.log(status);

        if(status){
          displayNotice(null,'server response ajax Update Content() true');
          editFormHasBeenChanged = false;
          return status;
        } else {
         displayNotice(null,'server response ajax Update Content() false');
         return status;
       }
     });
      return savingEdit.then(function(result){
        var status = jQuery( result ).find('status').text();
        return status;
      });

    }


    function ajaxNewTodo(){
      displayNotice(null,'doing ajax New Todo()');
      if(!userId){
        displayNotice(null,'Not saving. User not logged-in');
        return;
      }

      var pmTitle = jQuery('#new-todo-title').val();
      var pmFilter = jQuery('select#new-todo-label').val();

      console.log('starting ajax new todo');
      var ajax_data = {
        action: 'pm_new_todo',
        user_id : userId,
        title : pmTitle,
        pm_filter : pmFilter,
      }
      var mod_url = ajax_url+'pm_new_todo';
      var savingNewTodo = jQuery.post( mod_url, ajax_data, function(data){
        var reply = jQuery( data ).find('data').text();
        var status = jQuery( data ).find('status').text();
        console.log('All:');
        console.log(data);
        console.log('reply');
        console.log(reply);
        console.log('status');
        console.log(status);
        if(status){
         console.log('New Todo Created!');
         var pmTitle = jQuery('#new-todo-title').val();
         var pmFilter = jQuery('select#new-todo-label').val();
         var gridH = jQuery('#matrix-container').height();
         var gridW = jQuery('#matrix-container').width();
         var gridCenterX = gridW / 20;
         var gridCenterY = gridH / 23;
         var newPost = '<div id="drag-'+status+'" class="draggable drag-todo js-drag pm-activity dropzone yes-drop" data-postid="'+status+'" data-xpos="05" data-ypos="05" data-x="' + gridCenterX + '" data-y="' + gridCenterY + '" style="transform: translate(' + gridCenterX + 'px, ' + gridCenterY + 'px);"><div class="pm-todo-label ' + pmFilter + '" data-label="' + pmFilter + '"></div><div class="inner-border"><div class="todo-title">'+pmTitle+'</div></div><div class="update-border"></div><div class="status-border"></div><div class="remove-todo-open">X<div class="remove">Remove?</div></div></div>';
         jQuery('#todo-set').append(newPost);
         newFormStatus = false;
         return status;
       } else {
         console.log('New todo Ajax failed!');
         return false;
       }
     });
      return savingNewTodo.then(function(result){
        console.log('level 1 ajaxNewTodo result:');
        console.log(result);
        return result;
      });

    }

  //jQuery(drag-todo).not(jQuery(this)).removeClass(active);

  var matrixControls = jQuery(".pm-activity");

// enable draggables to be dropped into this
interact('.dropzone').dropzone({
  // only accept elements matching this CSS selector
  accept: '.yes-drop',
  // Require a 75% element overlap for a drop to be possible
  overlap: 0.75,

  // listen for drop related events:

  ondropactivate: function (event) {
    // add active dropzone feedback
    // may need to remove .dropzone and .yes-drop to event.relatedTarget
    event.target.classList.add('drop-active');
  },
  ondragenter: function (event) {
    var draggableElement = event.relatedTarget,
    dropzoneElement = event.target;

    // feedback the possibility of a drop
    dropzoneElement.classList.add('drop-target');
    draggableElement.classList.add('can-drop');
    //draggableElement.textContent = 'Dragged in';
  },
  ondragleave: function (event) {
    // remove the drop feedback style
    event.target.classList.remove('drop-target');
    event.relatedTarget.classList.remove('can-drop');
    //event.relatedTarget.textContent = 'Dragged out';
  },
  ondrop: function (event) {
    //event.relatedTarget.textContent = 'Dropped';
    event.relatedTarget.classList.add('dropped');
    console.log('remove dropped item and make it a subtask of drop-target');
  },
  ondropdeactivate: function (event) {
    // remove active dropzone feedback
    event.target.classList.remove('drop-active');
    event.target.classList.remove('drop-target');
  }
});

function updateWhatsCurrentlyActive(currentElement){


  if(currentElement){
    if(currentElement.id !== activeTodo){
      console.log('++they are not equal++');

    } else {
      console.log('++they are equal++');

    }
  }

  if(!currentElement){

    displayNotice(null,'updateWhatsCurrentlyActive deselecting all');

    if(editFormHasBeenChanged == 'changed'){
      displayNotice(null,'trying to save changed form before deselecting all');

      var checkSaved = saveUpdateFormContents();
      return checkSaved.then(function(result){
        console.log('return checkSaved then result:');
        console.log(result);
        if (result == false){
          displayNotice(null,'Failed to save edit update to server');
        } else {
          activeTodo = 0;
          loadEditor(activeTodo);
        }
        return result;
      });
    } else {

      activeTodo = 0;
      jQuery('.drag-todo').removeClass('active');
      loadEditor(activeTodo);
      return 'no need';
    }


  } else {

    if(editFormHasBeenChanged == 'changed'){

      var checkSaved = saveUpdateFormContents();
      return checkSaved.then(function(result){
        console.log('return checkSaved then result:');
        console.log(result);

        if (result == false){
          displayNotice(null,'Failed to save edit update to server');
          return false;
        } else {
          activeTodo = currentElement.id;
          //currentElement.className += " active";
          jQuery('.drag-todo').removeClass('active');
          jQuery('#'+activeTodo).addClass('active');
          loadEditor(activeTodo);
          setupTodoListeners();
          return true;
        }


        return result;
      });

    } else {

      console.log('setting active');
      activeTodo = currentElement.id;
      //currentElement.className += " active";
      jQuery('.remove').removeClass('removal');
      jQuery('.drag-todo').removeClass('active');
      jQuery('#'+activeTodo).addClass('active');
      loadEditor(activeTodo);

      setupTodoListeners();
      return true;


    }
  }
  return result;

}



function loadEditor(id){
  console.log('loadEditor('+id+')');
  if (!id){
    console.log('id is empty or false');
    clearFormEdit();
  } else {
    console.log('id has post');
    console.log( jQuery('#post_id').val() );
    console.log( id );
    var idVal = 'drag-'+jQuery('#post_id').val();

    if( idVal !== id ){

      var todoTitle = jQuery('#'+id+' .todo-title').html();
      var todoLabel = jQuery('#'+id+' .pm-todo-label').data('label');
      var todoPostid = jQuery('#'+id).data('postid');
      console.log(todoTitle);
      jQuery('#edit-todo-title').val(todoTitle);
      jQuery('select#todo-label').val(todoLabel);
      jQuery('#post_id').val(todoPostid);
      jQuery('#matrix-tabs a:last').tab('show');

      unlockEditForm();
      watchForEditFormUpdates();

    } else {
      console.log('already loaded');

    }

  }
}


function ajaxUpdateFilters(){
  console.log('ajaxUpdateFilters()');
  if(!userId){
    console.log('Not saving. User not logged-in');
    return false;
  }

  var postId = 'drag-'+jQuery('#post_id').val();
  var pmTitle = jQuery('#edit-todo-title').val();
  var pmFilter = jQuery('select#todo-label').val();

  var npmFilterOneLabel = $jQuery('#filter-one').data('color');
  var npmFilterOneColor = $jQuery('#filter-one-label').data('label');
  var npmFilterTwoLabel = $jQuery('#filter-two').data('color');
  var npmFilterTwoColor = $jQuery('#filter-two-label').data('label');
  var npmFilterThreeLabel = $jQuery('#filter-three').data('color');
  var npmFilterThreeColor = $jQuery('#filter-one-three').data('label');

  console.log('postId:'+postId);
  console.log('wpPostId:'+wpPostId);

  console.log('starting ajax content update');

  var ajax_data = {
    action: 'pm_update_filters',
    npm_filter_one_label : npmFilterOneLabel,
    npm_filter_one_color : npmFilterOneColor,
    npm_filter_two_label : npmFilterTwoLabel,
    npm_filter_one_color : npmFilterOneColor,
    npm_filter_two_label : npmFilterTwoLabel,
    npm_filter_one_color : npmFilterOneColor,
    npm_active_filter : npmActiveFilter,
  }
  var mod_url = ajax_url+'pm_update_filters';
  jQuery.post( mod_url, ajax_data, function(data){
    var reply = jQuery( data ).find('data').text();
    var status = jQuery( data ).find('status').text();
    console.log('All:');
    console.log(data);

    if(status){
      console.log('ajaxUpdateFilter Content updated!');
      updateFiltersStatus = false;
      return true;
    } else {
      updateFiltersStatus = true;
      displayNotice(null,'server ajaxUpdateFilters() returned false');
      return false;
    }
  });
}

jQuery('.matrix-filter').click(function(e){
  var filterOn = jQuery(this).data('filter');
  jQuery('.matrix-filter').removeClass('active');
  jQuery(this).addClass('active');
  console.log(filterOn);
  filterTodos(filterOn);
})

function filterTodos(targetFilter){
  var startTime = new Date().getTime();
  console.log('trying filter:'+targetFilter);
  if(targetFilter == 'filter-none'){
    jQuery('.drag-todo').removeClass('hidden');
    labelFilter = '';
  } else {
    jQuery('.drag-todo').addClass('hidden');
    jQuery('.'+targetFilter).removeClass('hidden');
    labelFilter = targetFilter;
  }
  var endTime = new Date().getTime() - startTime;
  console.log('Time to filter:'+endTime);
}


jQuery('.matrix-date-filter').click(function(e){
  var filterTime = jQuery(this).data('filter');
  jQuery('.matrix-date-filter').removeClass('active');
  jQuery(this).addClass('active');
  console.log(filterTime);
  filterDates(filterTime);
});

function filterDates(targetFilter){
  var startTime = new Date().getTime();
  console.log('trying filter:'+targetFilter);
  if(targetFilter == 'filter-none'){
    jQuery('.drag-todo').removeClass('hidden');
    dateFilter = '';
  } else {
    jQuery('.drag-todo').addClass('hidden');
    jQuery('.'+targetFilter).removeClass('hidden');
    dateFilter = targetFilter;
  }

  var endTime = new Date().getTime() - startTime;
  console.log('Time to filter:'+endTime);
}





function clearFormNew(){
  jQuery('#todo-new')[0].reset();
}
function clearFormEdit(){
  console.log('clearing form');
  jQuery('#todo-edit')[0].reset();
  jQuery('#post_id').val('');

}
function unlockEditForm(){
  var form = document.getElementById('todo-edit');
  var elements = form.elements;
  for (var i = 0, len = elements.length; i < len; ++i) {
    jQuery(elements[i]).attr('disabled',false);
  }
}
function lockEditForm(){
  var form = document.getElementById('todo-edit');
  var elements = form.elements;
  for (var i = 0, len = elements.length; i < len; ++i) {
    jQuery(elements[i]).attr('disabled',true);
  }
}
function unlockNewForm(){
  var form = document.getElementById('todo-new');
  var elements = form.elements;
  for (var i = 0, len = elements.length; i < len; ++i) {
    jQuery(elements[i]).attr('disabled',false);
  }
}
function lockNewForm(){
  var form = document.getElementById('todo-new');
  var elements = form.elements;
  for (var i = 0, len = elements.length; i < len; ++i) {
    jQuery(elements[i]).attr('disabled',true);
  }
}

function displayNotice(msg,debug){
  if(msg){
    console.log('msg'+msg);
    jQuery('#pm-error-notice').finish();
    jQuery('#pm-error-notice')
    .text(msg)
    .slideDown("slow")
    .delay(3000)
    .slideUp('slow');
  } else {
  }
  if(debug){
    console.log('displayNotice:'+debug);
  }
}


function setResizeListeners(){
  var resizeTimer;
  jQuery(window).on('resize', function(e) {
    clearTimeout(resizeTimer);
    containerSetup();
    resizeTimer = setTimeout(function() {
      repositionAllFromSavedPercentage();
    }, 250);
  });
}


function repositionAllFromSavedPercentage(){
  console.log('repositionAllFromSavedPercentage()');
  var gridH = jQuery('#matrix-container').height();
  var gridW = jQuery('#matrix-container').width();
  var todo = '';
  var todo = jQuery('.drag-todo');
  var xpos = '';
  var ypos = '';
  jQuery('.drag-todo').each(function(event){
   var item = document.getElementById(jQuery(this).attr('id'));
   var xpos = item.dataset.xpos;
   var ypos = item.dataset.ypos;
   if (!xpos){
    var xTrans = 0.1;
  } else {
    var xTrans = (gridW * xpos) / 100;
  }
  if (!ypos){
    var yTrans = 0.1;
  } else {
    var yTrans = (gridH * ypos) / 100;
  }
  item.setAttribute('data-x', xTrans);
  item.setAttribute('data-y', yTrans);      
  item.style.webkitTransform = 'translate(' + xTrans + 'px, ' + yTrans + 'px)';
  item.style.transform = 'translate(' + xTrans + 'px, ' + yTrans + 'px)';
});
}


function watchForEditFormUpdates(){
 editFormHasBeenChanged = false;
 jQuery('.todo-edit-input').each(function() {
   var elem = jQuery(this);
   elem.data('oldVal', elem.val());
   elem.bind("propertychange change click keyup input paste", function(event){
    if (elem.data('oldVal') != elem.val()) {
     elem.data('oldVal', elem.val());
     editFormHasBeenChanged = 'changed';
   }
 });
 });
}

function setupTodoListeners(){
  // unbind
  console.log('setupTodoListeners');

  jQuery('.remove-todo-open').unbind();
  jQuery('.remove').unbind();
  //jQuery('.remove').removeClass('removal');

  jQuery(".drag-todo.active .remove-todo-open").click(function(e){
    e.stopPropagation();
    console.log('clicked X set');
    //alert('clicked A');
    jQuery(".drag-todo.active .remove").addClass('removal');
  });
  jQuery(".drag-todo.active .remove").click(function(e){
    e.stopPropagation();

    var rTarget = jQuery(this).parent().parent().data('postid');
    var draft = ajaxSetAsDraft(rTarget);
    return draft.then(function(result){
      console.log('test result '+result+': '+result);
      rTargetId = '#'+activeTodo;
      console.log('activeTodo: '+rTargetId);
      jQuery(rTargetId).remove();
      updateWhatsCurrentlyActive();
      lockEditForm();
      return result;
    });


    
    console.log(this);
    console.log('clicked R set');
    var setDraft = ajaxSetAsDraft();
    alert('clicked B');


  });
}


function ajaxSetAsDraft(draftId){
  console.log('ajaxSendToDraft()');
  if(!userId){
    console.log('Not saving. User not logged-in');
    return false;
  }
  if(draftId !== activeTodo){
    console.log('draftId'+draftId);
    console.log('activeTodo'+activeTodo);
  }

  todoElement = document.getElementById(activeTodo);
  var wpPostId = todoElement.dataset.postid;

  var ajax_data = {
    action: 'pm_set_as_draft',
    post_id : wpPostId,
    user_id : userId
  }
  var mod_url = ajax_url+'pm_set_as_draft';
  var setDraft = jQuery.post( mod_url, ajax_data, function(data){
    var reply = jQuery( data ).find('data').text();
    var status = jQuery( data ).find('status').text();
    console.log('All:');
    console.log(data);

    if(status == 'setAsDraft'){
      console.log('ajaxSetAsDraft set to draft!');
      updateFiltersStatus = false;
      return status;
    } else {
      updateFiltersStatus = true;
      displayNotice(null,'server ajaxSetAsDraft() returned false');
      return false;
    }

  });
  return setDraft.then(function(result){
    var status = jQuery( result ).find('status').text();
    return status;
  });
}



}
});


