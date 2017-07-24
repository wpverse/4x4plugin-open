jQuery(document).ready(function() {
	console.log('Main.js Loaded');
  var activeTodo = '';
  var editFormStatus = '';
  var newFormStatus = '';
  var tryAjaxAgain = '';

  userId = jQuery('#matrix-container').data('userid');

  var resizeTimer;
  jQuery(window).on('resize', function(e) {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      repositionAllFromSavedPercentage();
    }, 250);
  });

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

  repositionAllFromSavedPercentage();

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
    	updatePosition(event.target.dataset.postid,event.target.dataset.xpos,event.target.dataset.ypos);

      
    }
  });

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
    updateCurrentlyActive(event.target);
  }
  window.dragMoveListener = dragMoveListener;

  jQuery('.grid-quad').click(function(){
    selectNone();
  });

  jQuery('.drag-todo').click(function(){
    updateCurrentlyActive(this);
  });

  jQuery('#pm_submit').click(function(e){
    e.preventDefault();
    e.stopPropagation();
    if (saveUpdateFormContents()){
      selectNone();
    } else {
      displayError('saveUpdateFormContents() failed. Keeping current selection');
    }
  });

  jQuery('#pm-form-edit-todo-panel input, #pm-form-edit-todo-panel select').on( 'input', function() {
    console.log('edit form change');
    editFormStatus = 'changed';
  });

  jQuery('#new_pm_submit').click(function(e){
    e.preventDefault();
    e.stopPropagation();
    if(!jQuery('#new-todo-title').val()){
      jQuery('#new-todo-title').addClass('alert-danger').delay('200').removeClass('alert-danger');
    }

    console.log('trying ajaxNewTodo()');
    var newTodoError = ajaxNewTodo();
    if (!newTodoError){
     tryAjaxAgain++;
     console.log(tryAjaxAgain);
   }


 });

  function selectNone(){
    console.log('Click.. :remove ACTIVE');
    jQuery('.drag-todo').removeClass('active');
    updateCurrentlyActive();
  }


  function saveUpdateFormContents(){
    console.log('saveUpdateFormContents()');
    if(activeTodo){
      var checkUpdated = ajaxUpdateContent();
      if(checkUpdated){
        displayError('ajax update success');
        return true;
      } else {
        displayError('ajaxUpdateContent failed');
        return false;
      }
    } else {
      displayError('saveUpdateFormContents() failed, no active selection');
      return false;
    }
  }

  function updatePosition(postId,xpos,ypos){
    console.log('updatePosition(postId,xpos,ypos)');
    var ajax_data = {
      action: 'pm_update_position',
      user_id : userId,
      post_id : postId,
      xpos: xpos,
      ypos: ypos
    }
    jQuery.post( ajax_url, ajax_data, function(data){
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
       displayError('ajax position server update failed!');
       return false;
     }
   });
  }


  function ajaxUpdateContent(todoId){
    console.log('ajaxUpdateContent(todoId)');
    if(!userId){
      console.log('Not saving. User not logged-in');
      return false;
    }
    todoElement = document.getElementById(activeTodo);
    if(!todoElement){
      console.log('ajaxUpdateContent failed. No currently selected item');
      return false;
    }

    var wpPostId = todoElement.dataset.postid;

    var postId = 'drag-'+jQuery('#post_id').val();
    var pmTitle = jQuery('#edit-todo-title').val();
    var pmLabel = jQuery('select#todo-label').val();

    jQuery('#'+activeTodo+' .pm-todo-label').removeClass('unlabeled red orange green');
    jQuery('#'+activeTodo+' .pm-todo-label').addClass(pmLabel).data('label',pmLabel);
    jQuery('#'+activeTodo+' .todo-title').html(pmTitle)

    console.log('postId:'+postId);
    console.log('wpPostId:'+wpPostId);

    console.log('starting ajax content update');
    var ajax_data = {
      action: 'pm_update_todo',
      post_id : wpPostId,
      user_id : userId,
      title : pmTitle,
      label : pmLabel,
    }

    jQuery.post( ajax_url, ajax_data, function(data){
      var reply = jQuery( data ).find('data').text();
      var status = jQuery( data ).find('status').text();
      console.log('All:');
      console.log(data);

      if(status){
       console.log('ajaxUpdateContent Content updated!');
       editFormStatus = false;
       return true;
     } else {

       displayError('ajaxUpdateContent Content update failed!');
       displayError(status);
       return false;
     }
   });


  }



  function ajaxNewTodo(){
    console.log('ajaxNewTodo()');
    if(!userId){
      console.log('Not saving. User not logged-in');
      displayError('Not saving. User not logged-in');
      return;
    }

    var pmTitle = jQuery('#new-todo-title').val();
    var pmLabel = jQuery('select#new-todo-label').val();

    console.log('starting ajax new todo');
    var ajax_data = {
      action: 'pm_new_todo',
      user_id : userId,
      title : pmTitle,
      label : pmLabel,
    }
    jQuery.post( ajax_url, ajax_data, function(data){
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
       var pmLabel = jQuery('select#new-todo-label').val();
       var gridH = jQuery('#matrix-container').height();
       var gridW = jQuery('#matrix-container').width();
       var gridCenterX = gridW / 2;
       var gridCenterY = gridH / 2;
       var newPost = '<div id="drag-'+status+'" class="draggable drag-todo js-drag pm-activity dropzone yes-drop" data-postid="'+status+'" data-xpos="50" data-ypos="50" data-x="' + gridCenterX + '" data-y="' + gridCenterY + '" style="transform: translate(' + gridCenterX + 'px, ' + gridCenterY + 'px);"><div class="pm-todo-label ' + pmLabel + '" data-label="' + pmLabel + '"></div><div class="inner-border"><div class="todo-title">'+pmTitle+'</div></div></div><div class="update-border"><div class="status-border"></div></div>';
       jQuery('#todo-set').append(newPost);
       newFormStatus = false;
       return status;
     } else {
       console.log('New todo Ajax failed!');
       return false;
     }
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



function updateCurrentlyActive(currentElement){
  console.log('updateCurrentlyActive(currentElement)');
  console.log(currentElement);
  jQuery('.drag-todo').removeClass('active');
  if(!currentElement){

    if(editFormStatus == 'changed'){
      var checkSaved = saveUpdateFormContents();
      if(checkSaved){
        activeTodo = 0;
        loadEditor(activeTodo);
      } else {
        displayError('saveUpdateFormContents() failed');
        return false;
      }
    } else {
      activeTodo = 0;
      loadEditor(activeTodo);
    }

  } else { 

    if(editFormStatus == 'changed'){
      var checkSaved = saveUpdateFormContents();
      if(checkSaved){
        activeTodo = currentElement.id;
        currentElement.className += " active";
        loadEditor(activeTodo);
      } else {
        displayError('saveUpdateFormContents() failed');
        return false;
      }
    } else {
      activeTodo = currentElement.id;
      currentElement.className += " active";
      loadEditor(activeTodo);
    }
  }
  console.log('active-todo:'+activeTodo);

}

function loadEditor(id){
  console.log('loadEditor('+id+')');
  if (!id){
    document.getElementById("todo-edit").reset();
  } else {
    var todoTitle = jQuery('#'+id+' .todo-title').html();
    var todoLabel = jQuery('#'+id+' .pm-todo-label').data('label');
    var todoPostid = jQuery('#'+id).data('postid');
    console.log(todoTitle);
    jQuery('#edit-todo-title').val(todoTitle);
    jQuery('select#todo-label').val(todoLabel);
    jQuery('#post_id').val(todoPostid);
    jQuery('#matrix-tabs a:last').tab('show');
  }
}


function displayError(msg){
  console.log('displayError:'+msg);
  //jQuery('#errorconsole').html(msg);
  //jQuery('#errorconsole').fadeIn(100).fadeOut(1000);
}


});



